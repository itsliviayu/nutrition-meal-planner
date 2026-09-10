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

export interface AppState {
  profile: UserProfile;
  foods: Food[];
  dailyPlan: DailyPlan | null;
  inventoryOnly: boolean;
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
  generationMessage: string | null;
  addFood: (food: Food) => void;
  editFood: (id: string, updates: Partial<Food>) => void;
  deleteFood: (id: string) => void;
  toggleInStock: (id: string) => void;
  toggleFavourite: (id: string) => void;
  toggleRegularBuy: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setInventoryOnly: (value: boolean) => void;
  generateDailyPlan: () => boolean;
  regenerateMeal: (mealType: MealType) => boolean;
  toggleMealItemLock: (mealType: MealType, foodId: string) => void;
  updateMealItemPortion: (mealType: MealType, foodId: string, amount: number) => void;
  clearGenerationMessage: () => void;
}

export interface PersistedAppData {
  profile: UserProfile;
  foods: Food[];
  dailyPlan: DailyPlan | null;
  inventoryOnly: boolean;
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
}

export const normalizePersistedAppData = (
  persisted: Partial<PersistedAppData> | undefined,
): PersistedAppData => ({
  profile: persisted?.profile ?? defaultProfile,
  foods: persisted?.foods ?? initialUserFoods,
  dailyPlan: persisted?.dailyPlan ?? null,
  inventoryOnly: persisted?.inventoryOnly ?? false,
  recentFoodIds: persisted?.recentFoodIds ?? [],
  recentRecipeTemplateIds: persisted?.recentRecipeTemplateIds ?? [],
});

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlan: null,
      inventoryOnly: false,
      recentFoodIds: [],
      recentRecipeTemplateIds: [],
      generationMessage: null,
      addFood: (food) => set((state) => ({ foods: [...state.foods, food] })),
      editFood: (id, updates) => set((state) => {
        const foods = state.foods.map((food) => (food.id === id ? { ...food, ...updates, id } : food));
        return {
          foods,
          dailyPlan: state.dailyPlan
            ? recalculateDailyPlan(state.dailyPlan, foods, state.profile)
            : null,
        };
      }),
      deleteFood: (id) => set((state) => {
        const usedInPlan = state.dailyPlan
          ? [state.dailyPlan.breakfast, state.dailyPlan.lunch, state.dailyPlan.snack]
            .some((meal) => meal.items.some((item) => item.foodId === id))
          : false;
        return {
          foods: state.foods.filter((food) => food.id !== id),
          dailyPlan: usedInPlan ? null : state.dailyPlan,
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
          dailyPlan: state.dailyPlan
            ? recalculateDailyPlan(state.dailyPlan, state.foods, profile)
            : null,
        };
      }),
      setInventoryOnly: (value) => set({ inventoryOnly: value }),
      generateDailyPlan: () => {
        const state = get();
        const result = buildDailyPlan({
          foods: state.foods,
          profile: state.profile,
          inventoryOnly: state.inventoryOnly,
          recentFoodIds: state.recentFoodIds,
          recentRecipeTemplateIds: state.recentRecipeTemplateIds,
        });
        if (!result.ok) {
          set({ generationMessage: result.message });
          return false;
        }
        const recent = recentFromPlan(result.plan);
        set({
          dailyPlan: result.plan,
          generationMessage: null,
          recentFoodIds: appendRecent(state.recentFoodIds, recent.recentFoodIds, 24),
          recentRecipeTemplateIds: appendRecent(state.recentRecipeTemplateIds, recent.recentRecipeTemplateIds, 12),
        });
        return true;
      },
      regenerateMeal: (mealType) => {
        const state = get();
        if (!state.dailyPlan) return false;
        const currentMeal = state.dailyPlan[mealType];
        const lockedItems = currentMeal.items.filter((item) => item.locked);
        const result = generateMeal({
          foods: state.foods,
          constraints: {
            mealType,
            lockedFoodIds: lockedItems.map((item) => item.foodId),
            includedFoodIds: [],
            excludedFoodIds: [],
            inventoryOnly: state.inventoryOnly,
            maxCookingTime: state.profile.defaultMaxCookingTime,
            allowedEquipment: state.profile.equipment,
          },
          target: targetForMealRegeneration(state.dailyPlan, mealType, state.profile),
          lockedItems,
          recentFoodIds: state.recentFoodIds,
          recentRecipeTemplateIds: state.recentRecipeTemplateIds,
        });
        if (!result.ok) {
          set({ generationMessage: result.message });
          return false;
        }
        const dailyPlan = recalculateDailyPlan({
          ...state.dailyPlan,
          [mealType]: result.meal,
        }, state.foods, state.profile);
        set({
          dailyPlan,
          generationMessage: null,
          recentFoodIds: appendRecent(state.recentFoodIds, result.meal.items.map((item) => item.foodId), 24),
          recentRecipeTemplateIds: appendRecent(state.recentRecipeTemplateIds, [result.meal.recipeTemplateId], 12),
        });
        return true;
      },
      toggleMealItemLock: (mealType, foodId) => set((state) => {
        if (!state.dailyPlan) return state;
        const meal = state.dailyPlan[mealType];
        return {
          dailyPlan: {
            ...state.dailyPlan,
            [mealType]: {
              ...meal,
              items: meal.items.map((item) => item.foodId === foodId
                ? { ...item, locked: !item.locked }
                : item),
            },
          },
        };
      }),
      updateMealItemPortion: (mealType, foodId, amount) => set((state) => ({
        dailyPlan: state.dailyPlan
          ? updatePlanPortion(state.dailyPlan, mealType, foodId, amount, state.foods, state.profile)
          : null,
      })),
      clearGenerationMessage: () => set({ generationMessage: null }),
    }),
    {
      name: "nourish-phase-1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        profile,
        foods,
        dailyPlan,
        inventoryOnly,
        recentFoodIds,
        recentRecipeTemplateIds,
      }) => ({
        profile,
        foods,
        dailyPlan,
        inventoryOnly,
        recentFoodIds,
        recentRecipeTemplateIds,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<PersistedAppData>;
        if (version >= 2) return normalizePersistedAppData(state);
        return normalizePersistedAppData({
          ...state,
          foods: (state.foods ?? []).map(migratePersistedFood),
        });
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedAppData(persistedState as Partial<PersistedAppData>),
      }),
    },
  ),
);
