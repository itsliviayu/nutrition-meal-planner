import type { Food, MealPlan, RecipeTemplate } from "../types";
import type { PlanningMode } from "../utils/planningMode";
import { foodMatchesSlot } from "./mealGenerator";
import { findRecipeTemplate, mapMealItemsToSlots } from "./generatedRecipe";

const isDirectReferenceFood = (food: Food): boolean =>
  food.nutritionSource === "reference" && !food.referenceFoodId;

export interface SwapCandidateInput {
  meal: MealPlan;
  foods: Food[];
  targetFoodId: string;
  planningMode: PlanningMode;
  templates?: RecipeTemplate[];
}

export const getIngredientSwapCandidates = ({
  meal,
  foods,
  targetFoodId,
  planningMode,
  templates,
}: SwapCandidateInput): Food[] => {
  const targetItem = meal.items.find((item) => item.foodId === targetFoodId);
  if (!targetItem || targetItem.locked) return [];
  const template = findRecipeTemplate(meal.recipeTemplateId, templates);
  if (!template) return [];
  const assignment = mapMealItemsToSlots(meal, foods, template)
    .find((entry) => entry.item.foodId === targetFoodId);
  if (!assignment?.slot) return [];
  const currentFoodIds = new Set(meal.items.map((item) => item.foodId));

  return foods
    .filter((food) =>
      !isDirectReferenceFood(food)
      && !currentFoodIds.has(food.id)
      && food.compatibleMeals.includes(meal.type)
      && (planningMode === "free" || food.inStock)
      && foodMatchesSlot(food, assignment.slot!),
    )
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.name.localeCompare(b.name));
};
