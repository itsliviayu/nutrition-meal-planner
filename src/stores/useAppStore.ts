import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultProfile } from "../data/defaultProfile";
import { migratePersistedFood } from "../data/foodMigration";
import { initialUserFoods } from "../data/initialFoods";
import type { Food, UserProfile } from "../types";

interface AppState {
  profile: UserProfile;
  foods: Food[];
  addFood: (food: Food) => void;
  editFood: (id: string, updates: Partial<Food>) => void;
  deleteFood: (id: string) => void;
  toggleInStock: (id: string) => void;
  toggleFavourite: (id: string) => void;
  toggleRegularBuy: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const updateFoodFlag = (
  foods: Food[],
  id: string,
  key: "inStock" | "favourite" | "regularBuy",
): Food[] => foods.map((food) => (food.id === id ? { ...food, [key]: !food[key] } : food));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      foods: initialUserFoods,
      addFood: (food) => set((state) => ({ foods: [...state.foods, food] })),
      editFood: (id, updates) =>
        set((state) => ({
          foods: state.foods.map((food) => (food.id === id ? { ...food, ...updates, id } : food)),
        })),
      deleteFood: (id) =>
        set((state) => ({ foods: state.foods.filter((food) => food.id !== id) })),
      toggleInStock: (id) =>
        set((state) => ({ foods: updateFoodFlag(state.foods, id, "inStock") })),
      toggleFavourite: (id) =>
        set((state) => ({ foods: updateFoodFlag(state.foods, id, "favourite") })),
      toggleRegularBuy: (id) =>
        set((state) => ({ foods: updateFoodFlag(state.foods, id, "regularBuy") })),
      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
    }),
    {
      name: "nourish-phase-1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ profile, foods }) => ({ profile, foods }),
      migrate: (persistedState, version) => {
        if (version >= 2) return persistedState as AppState;
        const state = persistedState as Pick<AppState, "profile" | "foods">;
        return {
          ...state,
          foods: state.foods.map(migratePersistedFood),
        };
      },
    },
  ),
);
