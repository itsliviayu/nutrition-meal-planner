import type { Food, ReferenceFood } from "../types";

interface ReferenceFoodOverrides {
  id: string;
  defaultServing?: number;
  store?: string;
  inStock?: boolean;
  regularBuy?: boolean;
  favourite?: boolean;
}

export const createUserFoodFromReference = (
  referenceFood: ReferenceFood,
  overrides: ReferenceFoodOverrides,
): Food => ({
  ...referenceFood,
  ...overrides,
  referenceFoodId: referenceFood.id,
  aliases: [...referenceFood.aliases],
  nutrition: { ...referenceFood.nutrition },
  tags: [...referenceFood.tags],
  compatibleMeals: [...referenceFood.compatibleMeals],
  store: overrides.store?.trim() || undefined,
  nutritionSource: "reference",
  estimatedNutrition: true,
});

const normalizedFoodName = (name: string): string =>
  name.trim().toLocaleLowerCase().replaceAll(/\s+/g, " ");

export const findReferenceDuplicate = (
  foods: Food[],
  referenceFood: ReferenceFood,
): Food | undefined => foods.find((food) =>
  food.referenceFoodId === referenceFood.id
  || normalizedFoodName(food.name) === normalizedFoodName(referenceFood.name),
);
