import { describe, expect, it } from "vitest";
import type { Food } from "../types";
import {
  calculateDailyNutrition,
  calculateFoodNutrition,
  calculateMealNutrition,
} from "./nutritionCalculator";

const food = (overrides: Partial<Food> = {}): Food => ({
  id: "test-food",
  name: "Test Food",
  category: "protein",
  nutritionBasis: "per_100g",
  nutrition: {
    calories: 100,
    protein: 20,
    carbs: 10,
    fat: 5,
    fibre: 2,
    sugar: 4,
  },
  defaultServing: 100,
  servingUnit: "g",
  inStock: true,
  regularBuy: false,
  favourite: false,
  nutritionSource: "manual_estimate",
  fibreSourceMethod: "AOAC",
  estimatedNutrition: true,
  tags: [],
  compatibleMeals: ["lunch"],
  ...overrides,
});

describe("nutritionCalculator", () => {
  it("scales per-100g nutrition down for a 50g portion", () => {
    expect(calculateFoodNutrition({ food: food(), amount: 50, unit: "g" })).toEqual({
      calories: 50,
      protein: 10,
      carbs: 5,
      fat: 2.5,
      fibre: 1,
      sugar: 2,
    });
  });

  it("scales per-100g nutrition up for a 200g portion", () => {
    expect(calculateFoodNutrition({ food: food(), amount: 200, unit: "g" }).protein).toBe(40);
  });

  it("calculates per-unit food and converts pieces using gramsPerUnit", () => {
    const egg = food({
      nutritionBasis: "per_unit",
      servingUnit: "piece",
      gramsPerUnit: 50,
      nutrition: { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fibre: 0 },
    });
    expect(calculateFoodNutrition({ food: egg, amount: 2, unit: "piece" }).calories).toBe(144);
    expect(calculateFoodNutrition({ food: egg, amount: 100, unit: "g" }).protein).toBe(12.6);
  });

  it("sums meal and daily nutrition through the shared engine", () => {
    const portion = { food: food(), amount: 50, unit: "g" as const };
    expect(calculateMealNutrition([portion, portion]).calories).toBe(100);
    expect(calculateDailyNutrition([[portion], [portion, portion]]).calories).toBe(150);
  });

  it("excludes NSP and unknown fibre from AOAC-comparable totals", () => {
    const aoac = food({ fibreSourceMethod: "AOAC" });
    const nsp = food({ fibreSourceMethod: "NSP", nutrition: { ...food().nutrition, fibre: 20 } });
    const unknown = food({ fibreSourceMethod: undefined, nutrition: { ...food().nutrition, fibre: undefined } });
    const unsourcedReference = food({ nutritionSource: "reference", fibreSourceMethod: undefined });

    expect(calculateFoodNutrition({ food: nsp, amount: 100, unit: "g" }).fibre).toBeUndefined();
    expect(calculateFoodNutrition({ food: unknown, amount: 100, unit: "g" }).fibre).toBeUndefined();
    expect(calculateFoodNutrition({ food: unsourcedReference, amount: 100, unit: "g" }).fibre).toBeUndefined();
    expect(calculateDailyNutrition([[
      { food: aoac, amount: 100, unit: "g" },
      { food: nsp, amount: 100, unit: "g" },
      { food: unknown, amount: 100, unit: "g" },
    ]]).fibre).toBe(2);
  });

  it("rejects invalid cross-unit conversions", () => {
    expect(() => calculateFoodNutrition({ food: food(), amount: 100, unit: "ml" })).toThrow();
  });
});
