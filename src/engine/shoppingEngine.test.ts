import { describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/seedFoods";
import type { DailyPlan, Food, GeneratedRecipe, MealPlan, RecipeTemplate, SavedRecipe } from "../types";
import {
  createShoppingItemsFromNeeds,
  excludePlanNeededSuggestions,
  getBuyAgainSuggestions,
  getGeneratedRecipeNeeds,
  getPlanNeededFoods,
  getSavedRecipeNeeds,
  getSuggestionBatch,
  getTrySomethingNewSuggestions,
  mergeShoppingItems,
  shoppingIdentityKey,
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

  it("keeps explicitly different User Food variants separate even when they share a referenceFoodId", () => {
    const first = { foodId: "milk-one", referenceFoodId: "semi-skimmed-milk", displayName: "Breakfast milk" };
    const second = { foodId: "milk-two", referenceFoodId: "semi-skimmed-milk", displayName: "Coffee milk" };

    expect(shoppingIdentityKey(first)).not.toBe(shoppingIdentityKey(second));
  });

  it("does not guess a Saved Recipe fallback when multiple User Foods share its referenceFoodId", () => {
    const first = userFood("semi-skimmed-milk", false, { id: "milk-one", name: "Breakfast milk" });
    const second = userFood("semi-skimmed-milk", false, { id: "milk-two", name: "Coffee milk" });
    const saved: SavedRecipe = {
      id: "saved-milk",
      name: "Saved breakfast",
      sourceTemplateId: "quick-breakfast-plate",
      mealType: "breakfast",
      ingredients: [{ foodId: "deleted-milk", referenceFoodId: "semi-skimmed-milk", foodName: "Milk", amount: 200, unit: "g" }],
      cookingTime: 5,
      equipment: [],
      instructions: ["Serve."],
      nutrition,
      fibreDataComplete: true,
      createdAt: "2026-09-10T12:00:00.000Z",
    };

    expect(getSavedRecipeNeeds(saved, [first, second])).toEqual([
      expect.objectContaining({ foodId: "deleted-milk", status: "stock_status_unavailable" }),
    ]);
  });
});

describe("shoppingEngine recommendations", () => {
  it("derives only out-of-stock User Foods used by the supplied plan", () => {
    const chicken = userFood("chicken-breast", true, { regularBuy: true });
    const broccoli = userFood("broccoli", false);
    const yogurt = userFood("greek-yogurt", false, { favourite: true });
    const needed = getPlanNeededFoods(freePlan(meal([chicken, broccoli])), [chicken, broccoli, yogurt]);

    expect(needed).toEqual([
      expect.objectContaining({ foodId: broccoli.id, mealTypes: ["lunch"] }),
    ]);
  });

  it("returns no plan needs before a DailyPlan has been generated", () => {
    expect(getPlanNeededFoods(null, [userFood("broccoli", false)])).toEqual([]);
  });

  it("returns no plan needs when every planned User Food is in stock", () => {
    const broccoli = userFood("broccoli", true);
    expect(getPlanNeededFoods(freePlan(meal([broccoli])), [broccoli])).toEqual([]);
  });

  it("deduplicates a missing food used in more than one meal and retains its meal types", () => {
    const broccoli = userFood("broccoli", false);
    const sharedMeal = meal([broccoli]);
    const plan = {
      ...freePlan(sharedMeal),
      breakfast: { ...sharedMeal, id: "breakfast", type: "breakfast" as const },
    };

    expect(getPlanNeededFoods(plan, [broccoli])).toEqual([
      expect.objectContaining({ foodId: broccoli.id, mealTypes: ["breakfast", "lunch"] }),
    ]);
  });

  it("derives different needs from different mode-specific plan inputs", () => {
    const broccoli = userFood("broccoli", false);
    const yogurt = userFood("greek-yogurt", false);

    expect(getPlanNeededFoods(freePlan(meal([broccoli])), [broccoli, yogurt])[0].foodId).toBe(broccoli.id);
    expect(getPlanNeededFoods(freePlan(meal([yogurt])), [broccoli, yogurt])[0].foodId).toBe(yogurt.id);
  });

  it("Stock Up contains only out-of-stock My Foods and no current-plan field", () => {
    const chicken = userFood("chicken-breast", true, { regularBuy: true });
    const broccoli = userFood("broccoli", false);
    const yogurt = userFood("greek-yogurt", false, { favourite: true });
    const suggestions = getBuyAgainSuggestions([chicken, broccoli, yogurt]);

    expect(suggestions.map((suggestion) => suggestion.foodId)).not.toContain(chicken.id);
    expect(suggestions.map((suggestion) => suggestion.foodId)).toEqual(expect.arrayContaining([broccoli.id, yogurt.id]));
    expect(suggestions.every((suggestion) => !("neededByCurrentPlan" in suggestion))).toBe(true);
  });

  it("excludes current plan needs from the Stock Up set shown on the same page", () => {
    const broccoli = userFood("broccoli", false);
    const yogurt = userFood("greek-yogurt", false);
    const needed = getPlanNeededFoods(freePlan(meal([broccoli])), [broccoli, yogurt]);
    const stockUp = excludePlanNeededSuggestions(getBuyAgainSuggestions([broccoli, yogurt]), needed);

    expect(stockUp.map((suggestion) => suggestion.foodId)).toEqual([yogurt.id]);
  });

  it("gives Regular Buy its independent 25-point boost", () => {
    const regular = userFood("broccoli", false, { id: "regular", name: "Regular", regularBuy: true });
    const plain = userFood("broccoli", false, { id: "plain", name: "Plain" });
    const suggestions = getBuyAgainSuggestions([plain, regular]);

    expect(suggestions[0].foodId).toBe("regular");
    expect(suggestions[0].score - suggestions[1].score).toBeCloseTo(25);
  });

  it("gives Favourite its independent 15-point boost", () => {
    const favourite = userFood("broccoli", false, { id: "favourite", name: "Favourite", favourite: true });
    const plain = userFood("broccoli", false, { id: "plain", name: "Plain" });
    const suggestions = getBuyAgainSuggestions([plain, favourite]);

    expect(suggestions[0].foodId).toBe("favourite");
    expect(suggestions[0].score - suggestions[1].score).toBe(15);
  });

  it("uses Recipe Coverage and Meal Versatility in Stock Up ranking", () => {
    const versatile = userFood("broccoli", false, { id: "versatile", name: "Versatile", compatibleMeals: ["breakfast", "lunch", "snack"], tags: ["quick"] });
    const narrow = userFood("broccoli", false, { id: "narrow", name: "Narrow", compatibleMeals: ["lunch"], tags: [] });
    const template = (id: string, allowedTags?: Food["tags"]): RecipeTemplate => ({
      id,
      name: id,
      mealTypes: ["breakfast", "lunch", "snack"],
      cookingTime: 5,
      equipment: [],
      slots: [{ id: "food", type: "vegetable", allowedTags, minItems: 1, maxItems: 1, optional: false }],
      nameRule: { ingredientSlotIds: ["food"], suffix: "", maxIngredients: 1 },
      instructionSteps: [{ text: "Prepare {food}." }],
      tags: [],
    });
    const suggestions = getBuyAgainSuggestions([narrow, versatile], [template("general"), template("quick", ["quick"])]);

    expect(suggestions[0]).toEqual(expect.objectContaining({ foodId: "versatile", recipeCoverage: 2, mealTypes: ["breakfast", "lunch", "snack"] }));
    expect(suggestions[1]).toEqual(expect.objectContaining({ foodId: "narrow", recipeCoverage: 1, mealTypes: ["lunch"] }));
    expect(suggestions[0].score).toBeCloseTo(60);
    expect(suggestions[1].score).toBeCloseTo(20 + (20 / 3));
  });

  it("returns deterministic non-overlapping batches and wraps after the last set", () => {
    const suggestions = Array.from({ length: 9 }, (_, index) => index);
    const first = getSuggestionBatch(suggestions, 0, 4);
    const second = getSuggestionBatch(suggestions, 1, 4);
    const wrapped = getSuggestionBatch(suggestions, 3, 4);

    expect(first.items).toEqual([0, 1, 2, 3]);
    expect(second.items).toEqual([4, 5, 6, 7]);
    expect(first.items.some((item) => second.items.includes(item))).toBe(false);
    expect(wrapped.items).toEqual(first.items);
    expect(first.hasAnotherSet).toBe(true);
  });

  it("does not offer another set when a candidate pool fits one batch", () => {
    expect(getSuggestionBatch([1, 2, 3], 0, 4)).toEqual({
      items: [1, 2, 3],
      page: 0,
      pageCount: 1,
      hasAnotherSet: false,
    });
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
