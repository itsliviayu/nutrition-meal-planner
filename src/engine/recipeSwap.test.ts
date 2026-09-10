import { describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import { recipeTemplates } from "../data/recipeTemplates";
import type { Food, MealPlan } from "../types";
import { calculateMealNutrition } from "./nutritionCalculator";
import { resolveMealPortions } from "./planNutrition";
import { getIngredientSwapCandidates } from "./recipeSwap";

const userFood = (referenceId: string, inStock = true): Food => {
  const reference = referenceFoods.find((food) => food.id === referenceId)!;
  return createUserFoodFromReference(reference, { id: `user-${referenceId}`, inStock });
};

const pasta = userFood("pasta");
const chicken = userFood("chicken-breast");
const mushroom = userFood("mushroom");
const spinach = userFood("spinach", false);
const broccoli = userFood("broccoli", true);
const directReferenceSpinach = referenceFoods.find((food) => food.id === "spinach")!;
const foods = [pasta, chicken, mushroom, spinach, broccoli, directReferenceSpinach];

const makeMeal = (locked = false): MealPlan => {
  const selectedFoods = [pasta, chicken, mushroom];
  const items = selectedFoods.map((food) => ({
    foodId: food.id,
    amount: food.defaultServing,
    unit: food.servingUnit,
    locked: locked && food.id === mushroom.id,
  }));
  return {
    id: "pasta-meal",
    type: "lunch",
    name: "Chicken & Mushrooms Pasta",
    items,
    recipeTemplateId: "pasta",
    nutrition: calculateMealNutrition(resolveMealPortions(items, foods)),
    cookingTime: recipeTemplates.find((template) => template.id === "pasta")!.cookingTime,
    equipment: ["hob"],
  };
};

describe("ingredient swap candidates", () => {
  it("uses compatible User Foods and never returns direct Reference Foods", () => {
    const candidates = getIngredientSwapCandidates({
      meal: makeMeal(),
      foods,
      targetFoodId: mushroom.id,
      planningMode: "free",
    });

    expect(candidates.map((candidate) => candidate.id)).toContain(spinach.id);
    expect(candidates.map((candidate) => candidate.id)).toContain(broccoli.id);
    expect(candidates.map((candidate) => candidate.id)).not.toContain(directReferenceSpinach.id);
    expect(candidates.every((candidate) => candidate.referenceFoodId)).toBe(true);
  });

  it("allows an out-of-stock compatible User Food in Plan Freely", () => {
    const candidates = getIngredientSwapCandidates({
      meal: makeMeal(),
      foods,
      targetFoodId: mushroom.id,
      planningMode: "free",
    });
    expect(candidates).toContain(spinach);
  });

  it("excludes an out-of-stock User Food in Use What I Have", () => {
    const candidates = getIngredientSwapCandidates({
      meal: makeMeal(),
      foods,
      targetFoodId: mushroom.id,
      planningMode: "inventory",
    });
    expect(candidates).not.toContain(spinach);
    expect(candidates).toContain(broccoli);
  });

  it("does not offer candidates for a locked ingredient", () => {
    expect(getIngredientSwapCandidates({
      meal: makeMeal(true),
      foods,
      targetFoodId: mushroom.id,
      planningMode: "free",
    })).toEqual([]);
  });

  it("does not offer foods already used elsewhere in the meal", () => {
    const candidates = getIngredientSwapCandidates({
      meal: makeMeal(),
      foods,
      targetFoodId: mushroom.id,
      planningMode: "free",
    });
    expect(candidates.map((candidate) => candidate.id)).not.toContain(chicken.id);
    expect(candidates.map((candidate) => candidate.id)).not.toContain(pasta.id);
  });
});
