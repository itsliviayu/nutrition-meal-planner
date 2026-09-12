import { describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import { recipeTemplates } from "../data/recipeTemplates";
import type { Food, MealPlan, MealType } from "../types";
import { calculateMealNutrition } from "./nutritionCalculator";
import { resolveMealPortions } from "./planNutrition";
import {
  createSavedRecipeSnapshot,
  deriveGeneratedRecipe,
  deriveSavedRecipeDisplay,
  mapMealItemsToSlots,
} from "./generatedRecipe";

const userFood = (referenceId: string, inStock = true): Food => {
  const reference = referenceFoods.find((food) => food.id === referenceId)!;
  return createUserFoodFromReference(reference, { id: `user-${referenceId}`, inStock });
};

const foods = [
  userFood("pasta"),
  userFood("chicken-breast"),
  userFood("mushroom"),
  userFood("tomato-pasta-sauce"),
  userFood("greek-yogurt"),
  userFood("banana"),
];

const mealFrom = (
  referenceIds: string[],
  recipeTemplateId: string,
  type: MealType,
): MealPlan => {
  const items = referenceIds.map((referenceId) => {
    const food = foods.find((candidate) => candidate.referenceFoodId === referenceId)!;
    return {
      foodId: food.id,
      amount: food.defaultServing,
      unit: food.servingUnit,
      locked: false,
    };
  });
  return {
    id: `meal-${recipeTemplateId}`,
    type,
    name: recipeTemplateId,
    items,
    recipeTemplateId,
    nutrition: calculateMealNutrition(resolveMealPortions(items, foods)),
    cookingTime: recipeTemplates.find((template) => template.id === recipeTemplateId)!.cookingTime,
    equipment: [...recipeTemplates.find((template) => template.id === recipeTemplateId)!.equipment],
  };
};

describe("generated recipe derivation", () => {
  it("derives a generated recipe from the MealPlan without recalculating its nutrition", () => {
    const meal = mealFrom(
      ["pasta", "chicken-breast", "mushroom", "tomato-pasta-sauce"],
      "pasta",
      "lunch",
    );
    const recipe = deriveGeneratedRecipe(meal, foods);

    expect(recipe.sourceTemplateId).toBe("pasta");
    expect(recipe.mealType).toBe("lunch");
    expect(recipe.ingredients.map((ingredient) => ingredient.foodName)).toEqual([
      "White Pasta, Cooked",
      "Chicken Breast",
      "Mushrooms",
      "Tomato Pasta Sauce",
    ]);
    expect(recipe.nutrition).toBe(meal.nutrition);
  });

  it("uses actual slot ingredients in a concise recipe name", () => {
    const meal = mealFrom(["pasta", "chicken-breast", "mushroom"], "pasta", "lunch");
    expect(deriveGeneratedRecipe(meal, foods).name).toBe("Chicken & Mushrooms Pasta");
  });

  it("maps MealItems back to their Recipe Slots and renders actual ingredients in steps", () => {
    const meal = mealFrom(
      ["pasta", "chicken-breast", "mushroom", "tomato-pasta-sauce"],
      "pasta",
      "lunch",
    );
    const template = recipeTemplates.find((candidate) => candidate.id === "pasta")!;
    const assignments = mapMealItemsToSlots(meal, foods, template);
    const recipe = deriveGeneratedRecipe(meal, foods);

    expect(assignments.map((assignment) => assignment.slot?.id)).toEqual([
      "pasta",
      "protein",
      "vegetable",
      "sauce",
    ]);
    expect(recipe.instructions).toContain("Prepare and cook chicken until cooked through.");
    expect(recipe.instructions).toContain("Add mushrooms and cook until tender.");
    expect(recipe.instructions).toContain("Stir in tomato pasta sauce.");
  });

  it("omits an optional instruction when its slot is not present", () => {
    const meal = mealFrom(["pasta", "chicken-breast", "mushroom"], "pasta", "lunch");
    expect(deriveGeneratedRecipe(meal, foods).instructions.join(" ")).not.toContain("Stir in");
  });

  it("keeps a no-cook yogurt bowl short and free from unnecessary cooking", () => {
    const meal = mealFrom(["greek-yogurt", "banana"], "yogurt-bowl", "breakfast");
    const recipe = deriveGeneratedRecipe(meal, foods);

    expect(recipe.name).toBe("Greek Yogurt & Banana Bowl");
    expect(recipe.instructions).toHaveLength(3);
    expect(recipe.instructions.join(" ")).toContain("No cooking required");
    expect(recipe.instructions.join(" ")).not.toMatch(/\b(oven|pan|boil|fry)\b/i);
  });

  it("reports partial fibre data without changing the MealPlan nutrition", () => {
    const meal = mealFrom(["pasta", "chicken-breast", "mushroom"], "pasta", "lunch");
    const partialFoods = foods.map((food) => food.referenceFoodId === "chicken-breast"
      ? {
        ...food,
        nutritionSource: "manual_estimate" as const,
        fibreSourceMethod: undefined,
        nutrition: { ...food.nutrition, fibre: undefined },
      }
      : food);
    const recipe = deriveGeneratedRecipe(meal, partialFoods);

    expect(recipe.fibreDataComplete).toBe(false);
    expect(recipe.nutrition).toBe(meal.nutrition);
  });

  it("creates a detached Saved Recipe snapshot", () => {
    const meal = mealFrom(["pasta", "chicken-breast", "mushroom"], "pasta", "lunch");
    const generated = deriveGeneratedRecipe(meal, foods);
    const saved = createSavedRecipeSnapshot(generated, {
      id: "saved-1",
      createdAt: "2026-09-10T12:00:00.000Z",
    });

    generated.ingredients[0].amount = 999;
    generated.instructions[0] = "Changed later";
    generated.nutrition.calories = 999;

    expect(saved.id).toBe("saved-1");
    expect(saved.ingredients[0].amount).not.toBe(999);
    expect(saved.instructions[0]).not.toBe("Changed later");
    expect(saved.nutrition.calories).not.toBe(999);
  });

  it("builds a deterministic Chinese pasta name and instructions from actual ingredients", () => {
    const meal = mealFrom(
      ["pasta", "chicken-breast", "mushroom", "tomato-pasta-sauce"],
      "pasta",
      "lunch",
    );
    const recipe = deriveGeneratedRecipe(meal, foods, undefined, "zh-CN");

    expect(recipe.name).toBe("鸡肉蘑菇意面");
    expect(recipe.ingredients.map((ingredient) => ingredient.foodName)).toEqual([
      "白意面",
      "鸡胸肉",
      "蘑菇",
      "番茄意面酱",
    ]);
    expect(recipe.instructions).toContain("处理并烹调鸡胸肉，确保完全熟透。");
    expect(recipe.instructions).toContain("加入蘑菇，翻炒至变软。");
    expect(recipe.instructions).toContain("加入番茄意面酱，拌匀。");
  });

  it("keeps Chinese no-cook instructions concise and free of invented ingredients", () => {
    const meal = mealFrom(["greek-yogurt", "banana"], "yogurt-bowl", "breakfast");
    const recipe = deriveGeneratedRecipe(meal, foods, undefined, "zh-CN");

    expect(recipe.name).toBe("香蕉希腊酸奶碗");
    expect(recipe.instructions.join("")).toContain("无需烹饪");
    expect(recipe.instructions.join("")).not.toMatch(/黄油|奶油|芝士|油/);
  });

  it("localizes a Saved Recipe from its template and ingredient snapshot without mutating it", () => {
    const meal = mealFrom(["pasta", "chicken-breast", "mushroom"], "pasta", "lunch");
    const saved = createSavedRecipeSnapshot(deriveGeneratedRecipe(meal, foods));
    const snapshotBefore = structuredClone(saved);

    const display = deriveSavedRecipeDisplay(saved, foods, "zh-CN");

    expect(display.name).toBe("鸡肉蘑菇意面");
    expect(display.instructions.join("")).toContain("白意面");
    expect(saved).toEqual(snapshotBefore);
  });
});
