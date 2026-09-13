import { describe, expect, it } from "vitest";
import type { FoodCategory } from "../types";
import { initialUserFoods } from "./initialFoods";
import { referenceFoods } from "./referenceFoods";
import {
  browseReferenceFoods,
  getReferenceFoodCategoryCounts,
  POPULAR_REFERENCE_FOOD_IDS,
  searchReferenceFoods,
} from "./referenceFoodSearch";

describe("reference food catalogue", () => {
  it("contains the expected number of foods in each category", () => {
    const counts = referenceFoods.reduce<Record<FoodCategory, number>>(
      (result, food) => ({ ...result, [food.category]: result[food.category] + 1 }),
      { protein: 0, carb: 0, vegetable: 0, fruit: 0, fat_sauce: 0, composite: 0 },
    );

    expect(referenceFoods).toHaveLength(161);
    expect(counts).toEqual({
      protein: 41,
      carb: 29,
      vegetable: 41,
      fruit: 22,
      fat_sauce: 22,
      composite: 6,
    });
    expect(getReferenceFoodCategoryCounts()).toEqual({ all: 161, ...counts });
  });

  it("has unique ids, deterministic nutrition, and complete provenance", () => {
    expect(new Set(referenceFoods.map((food) => food.id)).size).toBe(referenceFoods.length);
    expect(new Set(referenceFoods.map((food) => `${food.referenceSourceName}:${food.referenceSourceId}`)).size)
      .toBe(referenceFoods.length);
    expect(referenceFoods.filter((food) => food.referenceSourceName === "UK CoFID 2021")).toHaveLength(160);
    expect(referenceFoods.filter((food) => food.referenceSourceName === "USDA FoodData Central")).toHaveLength(1);

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
    const unavailableFibreIds = referenceFoods
      .filter((food) => food.nutrition.fibre === undefined)
      .map((food) => food.id);

    expect(unavailableFibreIds).toHaveLength(27);
    expect(unavailableFibreIds).toEqual(expect.arrayContaining([
      "pork-mince",
      "low-fat-yogurt",
      "pearl-barley",
      "mixed-vegetables",
      "watermelon",
      "mustard",
      "falafel",
    ]));
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
    ["ryvita", "rye-crispbread"],
    ["bok choy", "pak-choi"],
    ["arugula", "rocket"],
    ["pita", "white-pitta"],
  ])("matches %s by name or alias", (query, expectedId) => {
    expect(searchReferenceFoods(query).map((food) => food.id)).toContain(expectedId);
  });

  it("browses the full catalogue and filters it without truncating search results", () => {
    expect(browseReferenceFoods("", "all")).toHaveLength(161);
    expect(browseReferenceFoods("", "vegetable")).toHaveLength(41);
    expect(browseReferenceFoods("", "fruit")).toHaveLength(22);
    expect(browseReferenceFoods("cheese", "all").length).toBeGreaterThan(4);
    expect(browseReferenceFoods("cheese", "protein").every((food) => food.category === "protein")).toBe(true);
    expect(searchReferenceFoods("a")).toHaveLength(12);
    expect(browseReferenceFoods("a", "all").length).toBeGreaterThan(12);
  });

  it("supports full-catalogue search in Chinese mode", () => {
    expect(browseReferenceFoods("甘蓝", "all", "zh-CN").map((food) => food.id)).toEqual(expect.arrayContaining([
      "red-cabbage",
      "green-cabbage",
    ]));
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
