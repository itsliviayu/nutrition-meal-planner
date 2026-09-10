import { describe, expect, it } from "vitest";
import { defaultProfile } from "../data/defaultProfile";
import { initialUserFoods } from "../data/initialFoods";
import type { DailyPlan } from "../types";
import { normalizePersistedAppData, type PersistedAppData } from "./useAppStore";

const meal = (type: "breakfast" | "lunch" | "snack") => ({
  id: type,
  type,
  name: type,
  items: [],
  recipeTemplateId: `${type}-template`,
  nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  cookingTime: 0,
  equipment: [],
});

const dailyPlan: DailyPlan = {
  date: "2026-09-10",
  breakfast: meal("breakfast"),
  lunch: meal("lunch"),
  snack: meal("snack"),
  totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  fruitVegPortions: 0,
  nutritionStatus: { calories: "low", protein: "low", fibre: "partial", fruitVeg: "low" },
  fibreDataComplete: false,
};

describe("V2 persisted app data", () => {
  it("restores a saved DailyPlan after a JSON round trip", () => {
    const saved: PersistedAppData = {
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlan,
      inventoryOnly: true,
      recentFoodIds: ["starter-egg"],
      recentRecipeTemplateIds: ["egg-snack"],
    };
    const restored = normalizePersistedAppData(JSON.parse(JSON.stringify(saved)) as PersistedAppData);
    expect(restored.dailyPlan).toEqual(dailyPlan);
    expect(restored.inventoryOnly).toBe(true);
  });

  it("adds Phase 2 defaults without overwriting existing V2 foods or profile", () => {
    const restored = normalizePersistedAppData({ profile: defaultProfile, foods: initialUserFoods });
    expect(restored.foods).toBe(initialUserFoods);
    expect(restored.profile).toBe(defaultProfile);
    expect(restored.dailyPlan).toBeNull();
    expect(restored.recentFoodIds).toEqual([]);
  });
});
