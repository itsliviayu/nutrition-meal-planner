import { describe, expect, it } from "vitest";
import { cookingTechniques } from "../data/cookingTechniques";
import { relaxedMealBlueprints } from "../data/relaxedMealBlueprints";
import type { Food, MealCandidate } from "../types";
import { scoreCandidate } from "./candidateScoring";

const food = (id: string, category: Food["category"], ingredientKind: NonNullable<Food["ingredientKind"]>): Food => ({
  id,
  name: id,
  category,
  ingredientKind,
  nutritionBasis: "per_100g",
  nutrition: { calories: 100, protein: 10, carbs: 10, fat: 3, fibre: 1 },
  defaultServing: 100,
  servingUnit: "g",
  inStock: true,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  estimatedNutrition: false,
  tags: ["lunch", "savoury"],
  compatibleMeals: ["lunch"],
});

describe("candidate culinary compatibility scoring", () => {
  it("ranks a coherent pasta composition above a nutrition-equivalent odd one", () => {
    const pasta = food("pasta", "carb", "pasta");
    const ham = food("ham", "protein", "cooked_meat");
    const spinach = food("spinach", "vegetable", "vegetable");
    const milk = food("milk", "protein", "milk");
    const banana = food("banana", "fruit", "fruit");
    const allFoods = [pasta, ham, spinach, milk, banana];
    const candidate = (foods: Food[]): MealCandidate => ({
      template: relaxedMealBlueprints.find((item) => item.id === "relaxed-lunch")!,
      technique: cookingTechniques.find((item) => item.id === "pasta_toss")!,
      items: foods.map((item) => ({ foodId: item.id, amount: 100, unit: "g", locked: false })),
      nutrition: { calories: 400, protein: 30, carbs: 45, fat: 12, fibre: 6 },
      fruitVegPortions: 1,
      fibreDataComplete: true,
      score: 0,
    });
    const context = {
      foods: allFoods,
      constraints: {
        mealType: "lunch" as const,
        lockedFoodIds: [],
        includedFoodIds: [],
        excludedFoodIds: [],
        inventoryOnly: false,
        allowedEquipment: ["hob" as const],
        maxCookingTime: 30,
      },
      target: {
        calories: { min: 350, max: 500 },
        protein: { min: 20, max: 40 },
      },
      recentFoodIds: [],
      recentRecipeTemplateIds: [],
    };

    const coherent = scoreCandidate(candidate([pasta, ham, spinach]), context);
    const odd = scoreCandidate(candidate([pasta, milk, banana]), context);
    expect(coherent).toBeGreaterThan(odd);
    expect(coherent - odd).toBeGreaterThanOrEqual(5);
  });
});
