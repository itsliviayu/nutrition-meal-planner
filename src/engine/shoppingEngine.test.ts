import { describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/seedFoods";
import type { DailyPlan, Food, GeneratedRecipe, MealPlan, SavedRecipe } from "../types";
import {
  createShoppingItemsFromNeeds,
  getBuyAgainSuggestions,
  getGeneratedRecipeNeeds,
  getSavedRecipeNeeds,
  getTrySomethingNewSuggestions,
  mergeShoppingItems,
} from "./shoppingEngine";

const nutrition = { calories: 300, protein: 25, carbs: 30, fat: 8, fibre: 5 };

const userFood = (referenceFoodId: string, inStock: boolean, overrides: Partial<Food> = {}): Food => {
  const reference = referenceFoods.find((food) => food.id === referenceFoodId)!;
  return {
    ...createUserFoodFromReference(reference, {
      id: `user-${referenceFoodId}`,
      inStock,
      regularBuy: false,
      favourite: false,
    }),
    ...overrides,
  };
};

const generatedRecipe = (foods: Food[]): GeneratedRecipe => ({
  name: "Chicken & Broccoli Rice Bowl",
  sourceTemplateId: "rice-bowl",
  mealType: "lunch",
  ingredients: foods.map((food) => ({
    foodId: food.id,
    referenceFoodId: food.referenceFoodId,
    foodName: food.name,
    amount: food.defaultServing,
    unit: food.servingUnit,
    category: food.category,
    inStock: food.inStock,
    locked: false,
  })),
  cookingTime: 20,
  equipment: ["hob"],
  instructions: ["Cook and serve."],
  nutrition,
  fibreDataComplete: true,
});

const meal = (foods: Food[]): MealPlan => ({
  id: "meal",
  type: "lunch",
  name: "Rice Bowl",
  items: foods.map((food) => ({ foodId: food.id, amount: food.defaultServing, unit: food.servingUnit, locked: false })),
  recipeTemplateId: "rice-bowl",
  nutrition,
  cookingTime: 20,
  equipment: ["hob"],
});

const freePlan = (lunch: MealPlan): DailyPlan => ({
  date: "2026-09-10",
  breakfast: { ...lunch, id: "breakfast", type: "breakfast", items: [], recipeTemplateId: "quick-breakfast-plate" },
  lunch,
  snack: { ...lunch, id: "snack", type: "snack", items: [], recipeTemplateId: "yogurt-snack" },
  totalNutrition: nutrition,
  fruitVegPortions: 1,
  nutritionStatus: { calories: "low", protein: "low", fibre: "low", fruitVeg: "low" },
  fibreDataComplete: true,
});

describe("shoppingEngine missing ingredients", () => {
  it("returns only out-of-stock User Foods for a Generated Recipe", () => {
    const chicken = userFood("chicken-breast", true);
    const broccoli = userFood("broccoli", false);

    expect(getGeneratedRecipeNeeds(generatedRecipe([chicken, broccoli]), [chicken, broccoli])).toEqual([
      expect.objectContaining({ foodId: broccoli.id, displayName: "Broccoli", status: "missing" }),
    ]);
  });

  it("resolves a Saved Recipe by referenceFoodId and reports unsafe matches as unavailable", () => {
    const broccoli = userFood("broccoli", false, { id: "replacement-broccoli" });
    const saved: SavedRecipe = {
      id: "saved",
      name: "Saved Bowl",
      sourceTemplateId: "rice-bowl",
      mealType: "lunch",
      ingredients: [
        { foodId: "old-broccoli", referenceFoodId: "broccoli", foodName: "Broccoli", amount: 100, unit: "g" },
        { foodId: "deleted-custom", foodName: "Old Sauce", amount: 60, unit: "g" },
      ],
      cookingTime: 20,
      equipment: ["hob"],
      instructions: ["Cook."],
      nutrition,
      fibreDataComplete: true,
      createdAt: "2026-09-10T12:00:00.000Z",
    };

    expect(getSavedRecipeNeeds(saved, [broccoli])).toEqual([
      expect.objectContaining({ foodId: broccoli.id, status: "missing" }),
      expect.objectContaining({ displayName: "Old Sauce", status: "stock_status_unavailable" }),
    ]);
  });

  it("deduplicates the same food while preserving multiple sources", () => {
    const need = { foodId: "user-broccoli", referenceFoodId: "broccoli", displayName: "Broccoli", status: "missing" as const };
    const fromRecipe = createShoppingItemsFromNeeds([need], "recipe", () => "one", "2026-09-10T12:00:00.000Z");
    const fromSaved = createShoppingItemsFromNeeds([need], "saved_recipe", () => "two", "2026-09-10T12:01:00.000Z");

    expect(mergeShoppingItems(fromRecipe, fromSaved)).toEqual([
      expect.objectContaining({ sources: ["recipe", "saved_recipe"] }),
    ]);
  });
});

describe("shoppingEngine recommendations", () => {
  it("Buy Again contains only out-of-stock My Foods and prioritises a current plan need", () => {
    const chicken = userFood("chicken-breast", true, { regularBuy: true });
    const broccoli = userFood("broccoli", false);
    const yogurt = userFood("greek-yogurt", false, { favourite: true });
    const suggestions = getBuyAgainSuggestions(
      [chicken, broccoli, yogurt],
      freePlan(meal([chicken, broccoli])),
    );

    expect(suggestions.map((suggestion) => suggestion.foodId)).not.toContain(chicken.id);
    expect(suggestions.map((suggestion) => suggestion.foodId)).toEqual(expect.arrayContaining([broccoli.id, yogurt.id]));
    expect(suggestions[0]).toEqual(expect.objectContaining({ foodId: broccoli.id, neededByCurrentPlan: true }));
  });

  it("Try Something New returns only Reference Foods not already represented in My Foods", () => {
    const egg = userFood("egg", true);
    const references = referenceFoods.filter((food) => ["egg", "cod", "courgette", "couscous"].includes(food.id));
    const suggestions = getTrySomethingNewSuggestions(references, [egg], undefined, 3);

    expect(suggestions).toHaveLength(3);
    expect(suggestions.map((suggestion) => suggestion.referenceFoodId)).not.toContain("egg");
    expect(suggestions.every((suggestion) => references.some((reference) => reference.id === suggestion.referenceFoodId))).toBe(true);
    expect(egg.inStock).toBe(true);
  });
});
