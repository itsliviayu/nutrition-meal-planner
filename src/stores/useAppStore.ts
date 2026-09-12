import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultProfile } from "../data/defaultProfile";
import { createUserFoodFromReference, findReferenceDuplicate } from "../data/foodFactory";
import { migratePersistedFood } from "../data/foodMigration";
import { initialUserFoods } from "../data/initialFoods";
import { referenceFoods } from "../data/seedFoods";
import { generateDailyPlan as buildDailyPlan } from "../engine/dailyGenerator";
import { generateMeal } from "../engine/mealGenerator";
import { recalculateDailyPlan, updateMealItemPortion as updatePlanPortion } from "../engine/planNutrition";
import { targetForMealRegeneration } from "../engine/dailyGenerator";
import { createSavedRecipeSnapshot, deriveGeneratedRecipe, findRecipeTemplate, getMealCompatibleTechniques, recipeSnapshotKey } from "../engine/generatedRecipe";
import { getCompatibleTechniques, selectDefaultTechnique } from "../engine/cookingTechnique";
import { getIngredientSwapCandidates } from "../engine/recipeSwap";
import { createShoppingItemsFromNeeds, mergeShoppingItems } from "../engine/shoppingEngine";
import { DEFAULT_LOCALE, isLocale, type Locale } from "../i18n/locale";
import type {
  DailyPlan,
  Food,
  GeneratedRecipe,
  MealType,
  SavedRecipe,
  ShoppingItem,
  ShoppingItemSource,
  ShoppingNeed,
  UserProfile,
} from "../types";
import { createId } from "../utils/id";
import {
  inventoryOnlyFromPlanningMode,
  planningModeFromInventoryOnly,
  type PlanningMode,
} from "../utils/planningMode";

export interface ModeDailyPlans {
  free: DailyPlan | null;
  inventory: DailyPlan | null;
}

export interface AppState {
  locale: Locale;
  profile: UserProfile;
  foods: Food[];
  dailyPlans: ModeDailyPlans;
  activePlanningMode: PlanningMode;
  savedRecipes: SavedRecipe[];
  shoppingItems: ShoppingItem[];
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
  generationMessage: string | null;
  setLocale: (locale: Locale) => void;
  addFood: (food: Food) => void;
  addFoods: (foods: Food[]) => void;
  editFood: (id: string, updates: Partial<Food>) => void;
  deleteFood: (id: string) => void;
  toggleInStock: (id: string) => void;
  toggleFavourite: (id: string) => void;
  toggleRegularBuy: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActivePlanningMode: (mode: PlanningMode) => void;
  generateDailyPlan: () => boolean;
  regenerateMeal: (mealType: MealType) => boolean;
  toggleMealItemLock: (mealType: MealType, foodId: string) => void;
  updateMealItemPortion: (mealType: MealType, foodId: string, amount: number) => void;
  swapMealItem: (mealType: MealType, foodId: string, replacementFoodId: string) => boolean;
  changeMealTechnique: (mealType: MealType) => boolean;
  saveRecipe: (recipe: GeneratedRecipe) => SavedRecipe;
  deleteSavedRecipe: (id: string) => void;
  addShoppingNeeds: (needs: ShoppingNeed[], source: ShoppingItemSource) => void;
  addFoodToShopping: (foodId: string) => void;
  removeShoppingItem: (id: string) => void;
  markShoppingItemBought: (id: string) => boolean;
  addReferenceFoodToMyFoods: (referenceFoodId: string, inStock?: boolean) => Food | undefined;
  clearGenerationMessage: () => void;
}

export interface PersistedAppData {
  locale: Locale;
  profile: UserProfile;
  foods: Food[];
  dailyPlans: ModeDailyPlans;
  activePlanningMode: PlanningMode;
  savedRecipes: SavedRecipe[];
  shoppingItems: ShoppingItem[];
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
}

export interface LegacyPersistedAppData {
  dailyPlan: DailyPlan | null;
  inventoryOnly: boolean;
}

type PersistedAppInput = Partial<PersistedAppData> & Partial<LegacyPersistedAppData>;

export const APP_STORAGE_VERSION = 6;

const emptyDailyPlans = (): ModeDailyPlans => ({ free: null, inventory: null });

const isPlanningMode = (value: unknown): value is PlanningMode =>
  value === "free" || value === "inventory";

export const normalizePersistedAppData = (
  persisted: PersistedAppInput | undefined,
): PersistedAppData => {
  const activePlanningMode = isPlanningMode(persisted?.activePlanningMode)
    ? persisted.activePlanningMode
    : planningModeFromInventoryOnly(persisted?.inventoryOnly ?? false);
  const legacyDailyPlan = persisted?.dailyPlan ?? null;
  const dailyPlans = persisted?.dailyPlans
    ? {
      free: persisted.dailyPlans.free ?? null,
      inventory: persisted.dailyPlans.inventory ?? null,
    }
    : {
      ...emptyDailyPlans(),
      [activePlanningMode]: legacyDailyPlan,
    };

  return {
    locale: isLocale(persisted?.locale) ? persisted.locale : DEFAULT_LOCALE,
    profile: persisted?.profile ?? defaultProfile,
    foods: persisted?.foods ?? initialUserFoods,
    dailyPlans,
    activePlanningMode,
    savedRecipes: persisted?.savedRecipes ?? [],
    shoppingItems: persisted?.shoppingItems ?? [],
    recentFoodIds: persisted?.recentFoodIds ?? [],
    recentRecipeTemplateIds: persisted?.recentRecipeTemplateIds ?? [],
  };
};

export const migratePersistedAppData = (
  persistedState: unknown,
  version: number,
): PersistedAppData => {
  const state = persistedState as PersistedAppInput;
  if (version >= 2) return normalizePersistedAppData(state);
  return normalizePersistedAppData({
    ...state,
    foods: (state.foods ?? []).map(migratePersistedFood),
  });
};

export const selectActiveDailyPlan = (
  state: Pick<AppState, "dailyPlans" | "activePlanningMode">,
): DailyPlan | null => state.dailyPlans[state.activePlanningMode];

const updateFoodFlag = (
  foods: Food[],
  id: string,
  key: "inStock" | "favourite" | "regularBuy",
): Food[] => foods.map((food) => (food.id === id ? { ...food, [key]: !food[key] } : food));

const recentFromPlan = (plan: DailyPlan) => ({
  recentFoodIds: plan.breakfast.items
    .concat(plan.lunch.items, plan.snack.items)
    .map((item) => item.foodId),
  recentRecipeTemplateIds: [
    plan.breakfast.recipeTemplateId,
    plan.lunch.recipeTemplateId,
    plan.snack.recipeTemplateId,
  ],
});

const appendRecent = (current: string[], next: string[], limit: number): string[] =>
  [...current, ...next].slice(-limit);

const recalculatePlans = (
  dailyPlans: ModeDailyPlans,
  foods: Food[],
  profile: UserProfile,
): ModeDailyPlans => ({
  free: dailyPlans.free ? recalculateDailyPlan(dailyPlans.free, foods, profile) : null,
  inventory: dailyPlans.inventory
    ? recalculateDailyPlan(dailyPlans.inventory, foods, profile)
    : null,
});

const planUsesFood = (plan: DailyPlan | null, foodId: string): boolean => plan
  ? [plan.breakfast, plan.lunch, plan.snack]
    .some((meal) => meal.items.some((item) => item.foodId === foodId))
  : false;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      locale: DEFAULT_LOCALE,
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlans: emptyDailyPlans(),
      activePlanningMode: "free",
      savedRecipes: [],
      shoppingItems: [],
      recentFoodIds: [],
      recentRecipeTemplateIds: [],
      generationMessage: null,
      setLocale: (locale) => set({ locale }),
      addFood: (food) => set((state) => ({ foods: [...state.foods, food] })),
      addFoods: (foods) => set((state) => ({ foods: [...state.foods, ...foods] })),
      editFood: (id, updates) => set((state) => {
        const foods = state.foods.map((food) => (food.id === id ? { ...food, ...updates, id } : food));
        return {
          foods,
          dailyPlans: recalculatePlans(state.dailyPlans, foods, state.profile),
        };
      }),
      deleteFood: (id) => set((state) => {
        return {
          foods: state.foods.filter((food) => food.id !== id),
          dailyPlans: {
            free: planUsesFood(state.dailyPlans.free, id) ? null : state.dailyPlans.free,
            inventory: planUsesFood(state.dailyPlans.inventory, id)
              ? null
              : state.dailyPlans.inventory,
          },
        };
      }),
      toggleInStock: (id) =>
        set((state) => ({ foods: updateFoodFlag(state.foods, id, "inStock") })),
      toggleFavourite: (id) =>
        set((state) => ({ foods: updateFoodFlag(state.foods, id, "favourite") })),
      toggleRegularBuy: (id) =>
        set((state) => ({ foods: updateFoodFlag(state.foods, id, "regularBuy") })),
      updateProfile: (updates) => set((state) => {
        const profile = { ...state.profile, ...updates };
        return {
          profile,
          dailyPlans: recalculatePlans(state.dailyPlans, state.foods, profile),
        };
      }),
      setActivePlanningMode: (activePlanningMode) => set({ activePlanningMode }),
      generateDailyPlan: () => {
        const state = get();
        const mode = state.activePlanningMode;
        const result = buildDailyPlan({
          foods: state.foods,
          profile: state.profile,
          inventoryOnly: inventoryOnlyFromPlanningMode(mode),
          recentFoodIds: state.recentFoodIds,
          recentRecipeTemplateIds: state.recentRecipeTemplateIds,
        });
        if (!result.ok) {
          set({ generationMessage: result.message });
          return false;
        }
        const recent = recentFromPlan(result.plan);
        set({
          dailyPlans: { ...state.dailyPlans, [mode]: result.plan },
          generationMessage: null,
          recentFoodIds: appendRecent(state.recentFoodIds, recent.recentFoodIds, 24),
          recentRecipeTemplateIds: appendRecent(state.recentRecipeTemplateIds, recent.recentRecipeTemplateIds, 12),
        });
        return true;
      },
      regenerateMeal: (mealType) => {
        const state = get();
        const mode = state.activePlanningMode;
        const activePlan = selectActiveDailyPlan(state);
        if (!activePlan) return false;
        const currentMeal = activePlan[mealType];
        const lockedItems = currentMeal.items.filter((item) => item.locked);
        const result = generateMeal({
          foods: state.foods,
          constraints: {
            mealType,
            lockedFoodIds: lockedItems.map((item) => item.foodId),
            includedFoodIds: [],
            excludedFoodIds: [],
            inventoryOnly: inventoryOnlyFromPlanningMode(mode),
            maxCookingTime: state.profile.defaultMaxCookingTime,
            allowedEquipment: state.profile.equipment,
          },
          target: targetForMealRegeneration(activePlan, mealType, state.profile),
          lockedItems,
          recentFoodIds: state.recentFoodIds,
          recentRecipeTemplateIds: state.recentRecipeTemplateIds,
        });
        if (!result.ok) {
          set({ generationMessage: result.message });
          return false;
        }
        const dailyPlan = recalculateDailyPlan({
          ...activePlan,
          [mealType]: result.meal,
        }, state.foods, state.profile);
        set({
          dailyPlans: { ...state.dailyPlans, [mode]: dailyPlan },
          generationMessage: null,
          recentFoodIds: appendRecent(state.recentFoodIds, result.meal.items.map((item) => item.foodId), 24),
          recentRecipeTemplateIds: appendRecent(state.recentRecipeTemplateIds, [result.meal.recipeTemplateId], 12),
        });
        return true;
      },
      toggleMealItemLock: (mealType, foodId) => set((state) => {
        const activePlan = selectActiveDailyPlan(state);
        if (!activePlan) return state;
        const meal = activePlan[mealType];
        return {
          dailyPlans: {
            ...state.dailyPlans,
            [state.activePlanningMode]: {
              ...activePlan,
              [mealType]: {
                ...meal,
                items: meal.items.map((item) => item.foodId === foodId
                  ? { ...item, locked: !item.locked }
                  : item),
              },
            },
          },
        };
      }),
      updateMealItemPortion: (mealType, foodId, amount) => set((state) => {
        const activePlan = selectActiveDailyPlan(state);
        if (!activePlan) return state;
        return {
          dailyPlans: {
            ...state.dailyPlans,
            [state.activePlanningMode]: updatePlanPortion(
              activePlan,
              mealType,
              foodId,
              amount,
              state.foods,
              state.profile,
            ),
          },
        };
      }),
      swapMealItem: (mealType, foodId, replacementFoodId) => {
        const state = get();
        const mode = state.activePlanningMode;
        const activePlan = selectActiveDailyPlan(state);
        if (!activePlan) return false;
        const meal = activePlan[mealType];
        const replacement = getIngredientSwapCandidates({
          meal,
          foods: state.foods,
          targetFoodId: foodId,
          planningMode: mode,
          allowedEquipment: state.profile.equipment,
          maxCookingTime: state.profile.defaultMaxCookingTime,
        }).find((candidate) => candidate.id === replacementFoodId);
        if (!replacement) return false;

        const nextMeal = {
          ...meal,
          items: meal.items.map((item) => item.foodId === foodId
            ? {
              foodId: replacement.id,
              amount: replacement.defaultServing,
              unit: replacement.servingUnit,
              locked: false,
            }
            : item),
        };
        const nextPlan = recalculateDailyPlan(
          { ...activePlan, [mealType]: nextMeal },
          state.foods,
          state.profile,
        );
        const recalculatedMeal = nextPlan[mealType];
        const blueprint = findRecipeTemplate(recalculatedMeal.recipeTemplateId);
        const mealFoods = recalculatedMeal.items.flatMap((item) => {
          const food = state.foods.find((candidate) => candidate.id === item.foodId);
          return food ? [food] : [];
        });
        const techniques = blueprint ? getCompatibleTechniques({
          blueprint,
          mealType,
          foods: mealFoods,
          allowedEquipment: state.profile.equipment,
          maxCookingTime: state.profile.defaultMaxCookingTime,
        }) : [];
        const technique = techniques.find((candidate) => candidate.id === meal.techniqueId)
          ?? (blueprint ? selectDefaultTechnique(techniques, blueprint.id) : undefined);
        if (blueprint && !technique) return false;
        const namedMeal = {
          ...recalculatedMeal,
          techniqueId: technique?.id,
          cookingTime: technique?.cookingTime ?? recalculatedMeal.cookingTime,
          equipment: [...(technique?.requiredEquipment ?? recalculatedMeal.equipment)],
        };
        const generatedRecipe = deriveGeneratedRecipe(namedMeal, state.foods);
        set({
          dailyPlans: {
            ...state.dailyPlans,
            [mode]: {
              ...nextPlan,
              [mealType]: { ...namedMeal, name: generatedRecipe.name },
            },
          },
        });
        return true;
      },
      changeMealTechnique: (mealType) => {
        const state = get();
        const activePlan = selectActiveDailyPlan(state);
        if (!activePlan) return false;
        const meal = activePlan[mealType];
        const techniques = getMealCompatibleTechniques(meal, state.foods)
          .filter((technique) => technique.cookingTime <= state.profile.defaultMaxCookingTime
            && technique.requiredEquipment.every((item) => state.profile.equipment.includes(item)));
        if (techniques.length < 2) return false;
        const currentIndex = techniques.findIndex((technique) => technique.id === meal.techniqueId);
        const technique = techniques[(currentIndex + 1 + techniques.length) % techniques.length];
        const nextMeal = {
          ...meal,
          techniqueId: technique.id,
          cookingTime: technique.cookingTime,
          equipment: [...technique.requiredEquipment],
        };
        const generatedRecipe = deriveGeneratedRecipe(nextMeal, state.foods);
        set({
          dailyPlans: {
            ...state.dailyPlans,
            [state.activePlanningMode]: {
              ...activePlan,
              [mealType]: { ...nextMeal, name: generatedRecipe.name },
            },
          },
        });
        return true;
      },
      saveRecipe: (recipe) => {
        const state = get();
        const key = recipeSnapshotKey(recipe);
        const existing = state.savedRecipes.find((saved) => recipeSnapshotKey(saved) === key);
        if (existing) return existing;
        const savedRecipe = createSavedRecipeSnapshot(recipe);
        set({ savedRecipes: [savedRecipe, ...state.savedRecipes] });
        return savedRecipe;
      },
      deleteSavedRecipe: (id) => set((state) => ({
        savedRecipes: state.savedRecipes.filter((recipe) => recipe.id !== id),
      })),
      addShoppingNeeds: (needs, source) => set((state) => ({
        shoppingItems: mergeShoppingItems(
          state.shoppingItems,
          createShoppingItemsFromNeeds(needs, source),
        ),
      })),
      addFoodToShopping: (foodId) => set((state) => {
        const food = state.foods.find((candidate) => candidate.id === foodId);
        if (!food) return state;
        const needs: ShoppingNeed[] = [{
          foodId: food.id,
          referenceFoodId: food.referenceFoodId,
          displayName: food.name,
          status: "missing",
        }];
        return {
          shoppingItems: mergeShoppingItems(
            state.shoppingItems,
            createShoppingItemsFromNeeds(needs, "manual"),
          ),
        };
      }),
      removeShoppingItem: (id) => set((state) => ({
        shoppingItems: state.shoppingItems.filter((item) => item.id !== id),
      })),
      markShoppingItemBought: (id) => {
        const state = get();
        const item = state.shoppingItems.find((candidate) => candidate.id === id);
        if (!item) return false;
        const existingFood = state.foods.find((food) => food.id === item.foodId)
          ?? (item.referenceFoodId
            ? state.foods.find((food) => food.referenceFoodId === item.referenceFoodId)
            : undefined);
        if (existingFood) {
          set({
            foods: state.foods.map((food) => food.id === existingFood.id
              ? { ...food, inStock: true }
              : food),
            shoppingItems: state.shoppingItems.filter((candidate) => candidate.id !== id),
          });
          return true;
        }
        const referenceFood = item.referenceFoodId
          ? referenceFoods.find((food) => food.id === item.referenceFoodId)
          : undefined;
        if (!referenceFood) return false;
        const userFood = createUserFoodFromReference(referenceFood, {
          id: createId(),
          inStock: true,
          regularBuy: false,
          favourite: false,
        });
        set({
          foods: [...state.foods, userFood],
          shoppingItems: state.shoppingItems.filter((candidate) => candidate.id !== id),
        });
        return true;
      },
      addReferenceFoodToMyFoods: (referenceFoodId, inStock = false) => {
        const state = get();
        const referenceFood = referenceFoods.find((food) => food.id === referenceFoodId);
        if (!referenceFood) return undefined;
        const existingFood = findReferenceDuplicate(state.foods, referenceFood);
        if (existingFood) {
          if (inStock && !existingFood.inStock) {
            const updated = { ...existingFood, inStock: true };
            set({ foods: state.foods.map((food) => food.id === existingFood.id ? updated : food) });
            return updated;
          }
          return existingFood;
        }
        const userFood = createUserFoodFromReference(referenceFood, {
          id: createId(),
          inStock,
          regularBuy: false,
          favourite: false,
        });
        set({ foods: [...state.foods, userFood] });
        return userFood;
      },
      clearGenerationMessage: () => set({ generationMessage: null }),
    }),
    {
      name: "nourish-phase-1",
      version: APP_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        locale,
        profile,
        foods,
        dailyPlans,
        activePlanningMode,
        savedRecipes,
        shoppingItems,
        recentFoodIds,
        recentRecipeTemplateIds,
      }) => ({
        locale,
        profile,
        foods,
        dailyPlans,
        activePlanningMode,
        savedRecipes,
        shoppingItems,
        recentFoodIds,
        recentRecipeTemplateIds,
      }),
      migrate: migratePersistedAppData,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedAppData(persistedState as PersistedAppInput),
      }),
    },
  ),
);
