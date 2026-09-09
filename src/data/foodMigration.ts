import type { Food, NutritionSource } from "../types";
import { referenceFoods } from "./seedFoods";

type LegacyFood = Omit<Food, "nutritionSource"> & {
  nutritionSource?: NutritionSource;
};

export const migratePersistedFood = (food: LegacyFood): Food => {
  if (food.nutritionSource) return food as Food;

  const referenceFood = referenceFoods.find((item) => item.id === food.id);
  const nutritionSource: NutritionSource = referenceFood
    ? "reference"
    : food.estimatedNutrition
      ? "manual_estimate"
      : "package_label";

  return {
    ...food,
    referenceFoodId: referenceFood?.id,
    nutritionSource,
    estimatedNutrition: nutritionSource !== "package_label",
  };
};
