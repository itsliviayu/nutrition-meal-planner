import { describe, expect, it } from "vitest";
import type { FoodCategory } from "../types";
import { initialUserFoods } from "./initialFoods";
import { referenceFoods } from "./referenceFoods";
import { POPULAR_REFERENCE_FOOD_IDS, searchReferenceFoods } from "./referenceFoodSearch";

describe("reference food catalogue", () => {
  it("contains the expected number of foods in each category", () => {
    const counts = referenceFoods.reduce<Record<FoodCategory, number>>(
      (result, food) => ({ ...result, [food.category]: result[food.category] + 1 }),
      { protein: 0, carb: 0, vegetable: 0, fruit: 0, fat_sauce: 0, composite: 0 },
    );

    expect(referenceFoods).toHaveLength(83);
    expect(counts).toEqual({
      protein: 20,
      carb: 14,
      vegetable: 23,
      fruit: 12,
      fat_sauce: 11,
      composite: 3,
    });
  });

  it("has unique ids, deterministic nutrition, and complete provenance", () => {
    expect(new Set(referenceFoods.map((food) => food.id)).size).toBe(referenceFoods.length);

    referenceFoods.forEach((food) => {
      expect(food.nutritionSource).toBe("reference");
      expect(food.nutritionBasis).toBe("per_100g");
      expect(["UK CoFID 2021", "USDA FoodData Central"]).toContain(food.referenceSourceName);
      expect(food.referenceSourceId).toMatch(/^(\d{2}-\d{3,4}|\d+)$/);
      expect(food.referenceSourceUrl).toMatch(/^https:\/\//);
      expect(food.aliases).toBeInstanceOf(Array);
      expect(food.fibreSourceMethod).not.toBe("NSP");
      if (food.nutrition.fibre !== undefined) expect(food.fibreSourceMethod).toBe("AOAC");
      Object.values(food.nutrition).forEach((value) => {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it("leaves fibre unavailable when the source has no comparable AOAC value", () => {
    expect(referenceFoods.filter((food) => food.nutrition.fibre === undefined).map((food) => food.id).sort()).toEqual([
      "chicken-thigh",
      "garlic",
      "lean-beef",
      "peach",
      "skyr",
      "spring-onion",
      "tofu",
      "vegetable-soup",
    ]);
  });

  it("returns eight fixed popular foods for an empty search", () => {
    expect(searchReferenceFoods("").map((food) => food.id)).toEqual(POPULAR_REFERENCE_FOOD_IDS);
  });

  it.each([
    ["mush", "mushroom"],
    ["COUR", "courgette"],
    ["zucchini", "courgette"],
    ["shrimp", "prawns"],
    ["eggplant", "aubergine"],
    ["green onion", "spring-onion"],
    ["greek yoghurt", "greek-yogurt"],
  ])("matches %s by name or alias", (query, expectedId) => {
    expect(searchReferenceFoods(query).map((food) => food.id)).toContain(expectedId);
  });

  it("creates 15 fresh-install foods as reference-linked user copies", () => {
    expect(initialUserFoods).toHaveLength(15);
    initialUserFoods.forEach((food) => {
      expect(food.id).toBe(`starter-${food.referenceFoodId}`);
      expect(food.nutritionSource).toBe("reference");
      expect(referenceFoods.some((reference) => reference.id === food.referenceFoodId)).toBe(true);
    });
  });
});
