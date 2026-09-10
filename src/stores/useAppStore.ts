import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultProfile } from "../data/defaultProfile";
import { migratePersistedFood } from "../data/foodMigration";
import { initialUserFoods } from "../data/initialFoods";
import { generateDailyPlan as buildDailyPlan } from "../engine/dailyGenerator";
import { generateMeal } from "../engine/mealGenerator";
import { recalculateDailyPlan, updateMealItemPortion as updatePlanPortion } from "../engine/planNutrition";
import { targetForMealRegeneration } from "../engine/dailyGenerator";
import type { DailyPlan, Food, MealType, UserProfile } from "../types";
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
  profile: UserProfile;
  foods: Food[];
  dailyPlans: ModeDailyPlans;
  activePlanningMode: PlanningMode;
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
  generationMessage: string | null;
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
  clearGenerationMessage: () => void;
}

export interface PersistedAppData {
  profile: UserProfile;
  foods: Food[];
  dailyPlans: ModeDailyPlans;
  activePlanningMode: PlanningMode;
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
}

export interface LegacyPersistedAppData {
  dailyPlan: DailyPlan | null;
  inventoryOnly: boolean;
}

type PersistedAppInput = Partial<PersistedAppData> & Partial<LegacyPersistedAppData>;

export const APP_STORAGE_VERSION = 3;

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
    profile: persisted?.profile ?? defaultProfile,
    foods: persisted?.foods ?? initialUserFoods,
    dailyPlans,
    activePlanningMode,
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
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlans: emptyDailyPlans(),
      activePlanningMode: "free",
      recentFoodIds: [],
      recentRecipeTemplateIds: [],
      generationMessage: null,
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
      clearGenerationMessage: () => set({ generationMessage: null }),
    }),
    {
      name: "nourish-phase-1",
      version: APP_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        profile,
        foods,
        dailyPlans,
        activePlanningMode,
        recentFoodIds,
        recentRecipeTemplateIds,
      }) => ({
        profile,
        foods,
        dailyPlans,
        activePlanningMode,
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
