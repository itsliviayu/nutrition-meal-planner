import { describe, expect, it } from "vitest";
import { defaultProfile } from "../data/defaultProfile";
import type { DailyPlan, Food, MealPlan } from "../types";
import { recalculateDailyPlan, updateMealItemPortion } from "./planNutrition";

const food = (id: string, overrides: Partial<Food> = {}): Food => ({
  id,
  name: id,
  category: "protein",
  nutritionBasis: "per_100g",
  nutrition: { calories: 100, protein: 10, carbs: 5, fat: 2, fibre: 4 },
  defaultServing: 100,
  servingUnit: "g",
  inStock: true,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  estimatedNutrition: false,
  tags: [],
  compatibleMeals: ["breakfast", "lunch", "snack"],
  ...overrides,
});

const meal = (type: MealPlan["type"], foodId: string, amount = 100): MealPlan => ({
  id: `${type}-meal`,
  type,
  name: type,
  items: [{ foodId, amount, unit: "g", locked: false }],
  recipeTemplateId: `${type}-template`,
  nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  cookingTime: 5,
  equipment: [],
});

const plan = (foodId = "known"): DailyPlan => ({
  date: "2026-09-10",
  breakfast: meal("breakfast", foodId),
  lunch: meal("lunch", foodId),
  snack: meal("snack", foodId),
  totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  fruitVegPortions: 0,
  nutritionStatus: { calories: "low", protein: "low", fibre: "low", fruitVeg: "low" },
  fibreDataComplete: true,
});

describe("daily plan nutrition", () => {
  it("recalculates meal and daily nutrition through the shared engine", () => {
    const calculated = recalculateDailyPlan(plan(), [food("known")], defaultProfile);
    expect(calculated.breakfast.nutrition.calories).toBe(100);
    expect(calculated.totalNutrition).toMatchObject({ calories: 300, protein: 30, fibre: 12 });
  });

  it("recalculates food, meal, day and statuses after a portion change", () => {
    const calculated = recalculateDailyPlan(plan(), [food("known")], defaultProfile);
    const updated = updateMealItemPortion(calculated, "lunch", "known", 50, [food("known")], defaultProfile);
    expect(updated.lunch.nutrition.calories).toBe(50);
    expect(updated.totalNutrition.calories).toBe(250);
    expect(updated.totalNutrition.protein).toBe(25);
  });

  it("marks fibre as partial and does not treat unknown fibre as a complete zero", () => {
    const unknown = food("unknown", {
      nutritionSource: "manual_estimate",
      fibreSourceMethod: undefined,
      nutrition: { calories: 100, protein: 10, carbs: 5, fat: 2, fibre: undefined },
    });
    const knownPlan = plan("known");
    knownPlan.snack = meal("snack", "unknown");
    const calculated = recalculateDailyPlan(knownPlan, [food("known"), unknown], defaultProfile);
    expect(calculated.totalNutrition.fibre).toBe(8);
    expect(calculated.fibreDataComplete).toBe(false);
    expect(calculated.nutritionStatus.fibre).toBe("partial");
  });
});
