import type { Equipment, Food, MealPlan, RecipeTemplate } from "../types";
import type { PlanningMode } from "../utils/planningMode";
import { foodMatchesSlot } from "./mealGenerator";
import { findRecipeTemplate, mapMealItemsToSlots } from "./generatedRecipe";
import { getCompatibleTechniques } from "./cookingTechnique";

const isDirectReferenceFood = (food: Food): boolean =>
  food.nutritionSource === "reference" && !food.referenceFoodId;

export interface SwapCandidateInput {
  meal: MealPlan;
  foods: Food[];
  targetFoodId: string;
  planningMode: PlanningMode;
  templates?: RecipeTemplate[];
  allowedEquipment?: Equipment[];
  maxCookingTime?: number;
}

export const getIngredientSwapCandidates = ({
  meal,
  foods,
  targetFoodId,
  planningMode,
  templates,
  allowedEquipment,
  maxCookingTime,
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
      && foodMatchesSlot(food, assignment.slot!)
      && getCompatibleTechniques({
        blueprint: template,
        mealType: meal.type,
        foods: meal.items.flatMap((item) => {
          const resolved = item.foodId === targetFoodId
            ? food
            : foods.find((candidate) => candidate.id === item.foodId);
          return resolved ? [resolved] : [];
        }),
        allowedEquipment,
        maxCookingTime,
      }).length > 0,
    )
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.name.localeCompare(b.name));
};
