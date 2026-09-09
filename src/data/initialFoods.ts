import type { Food } from "../types";
import { createUserFoodFromReference } from "./foodFactory";
import { referenceFoods } from "./seedFoods";

const STARTER_FOOD_IDS = [
  "egg",
  "greek-yogurt",
  "chicken-breast",
  "white-rice",
  "pasta",
  "wholemeal-toast",
  "oats",
  "potato",
  "broccoli",
  "spinach",
  "mushroom",
  "banana",
  "blueberries",
  "olive-oil",
  "tomato-pasta-sauce",
] as const;

export const initialUserFoods: Food[] = STARTER_FOOD_IDS.map((referenceFoodId) => {
  const referenceFood = referenceFoods.find((food) => food.id === referenceFoodId);
  if (!referenceFood) throw new Error(`Missing starter reference food: ${referenceFoodId}`);
  return createUserFoodFromReference(referenceFood, {
    id: `starter-${referenceFood.id}`,
    inStock: true,
    regularBuy: true,
    favourite: ["egg", "greek-yogurt", "chicken-breast", "banana"].includes(referenceFood.id),
  });
});
