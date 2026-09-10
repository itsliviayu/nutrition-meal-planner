import { describe, expect, it } from "vitest";
import { defaultProfile } from "../data/defaultProfile";
import { initialUserFoods } from "../data/initialFoods";
import { referenceFoods } from "../data/referenceFoods";
import { generateDailyPlan } from "./dailyGenerator";

describe("dailyGenerator", () => {
  it("generates breakfast, lunch and snack from User Foods and totals the day", () => {
    const result = generateDailyPlan({
      foods: initialUserFoods,
      profile: defaultProfile,
      inventoryOnly: false,
      date: new Date("2026-09-10T12:00:00"),
      random: () => 0.42,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.date).toBe("2026-09-10");
    expect(result.plan.breakfast.items.length).toBeGreaterThan(0);
    expect(result.plan.lunch.items.length).toBeGreaterThan(0);
    expect(result.plan.snack.items.length).toBeGreaterThan(0);
    expect(result.plan.totalNutrition.calories).toBe(
      Math.round((result.plan.breakfast.nutrition.calories + result.plan.lunch.nutrition.calories + result.plan.snack.nutrition.calories) * 10) / 10,
    );
    expect(result.plan.breakfast.items.concat(result.plan.lunch.items, result.plan.snack.items)
      .every((item) => initialUserFoods.some((food) => food.id === item.foodId))).toBe(true);
  });

  it("does not silently fall back to the Reference Food Library", () => {
    const result = generateDailyPlan({
      foods: referenceFoods,
      profile: defaultProfile,
      inventoryOnly: false,
      random: () => 0.5,
    });
    expect(result).toMatchObject({ ok: false, reason: "insufficient_foods" });
  });

  it("produces multiple valid day shapes across different random rolls", () => {
    const signatures = [0.08, 0.27, 0.56, 0.88].flatMap((roll) => {
      const result = generateDailyPlan({
        foods: initialUserFoods,
        profile: defaultProfile,
        inventoryOnly: false,
        random: () => roll,
      });
      if (!result.ok) return [];
      return [[result.plan.breakfast.recipeTemplateId, result.plan.lunch.recipeTemplateId, result.plan.snack.recipeTemplateId].join(":")];
    });
    expect(signatures).toHaveLength(4);
    expect(new Set(signatures).size).toBeGreaterThan(1);
  });
});
