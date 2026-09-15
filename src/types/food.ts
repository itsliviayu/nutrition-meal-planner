import type { MealType } from "./meal";
import type { Nutrition, NutritionBasis, ServingUnit } from "./nutrition";

export type FoodCategory =
  | "protein"
  | "carb"
  | "vegetable"
  | "fruit"
  | "fat_sauce"
  | "composite";

export type FoodTag =
  | "high_protein"
  | "high_fibre"
  | "quick"
  | "breakfast"
  | "lunch"
  | "snack"
  | "vegetarian"
  | "freezer"
  | "sweet"
  | "savoury"
  | "no_cook"
  | "oven"
  | "hob"
  | "microwave";

export type NutritionSource =
  | "reference"
  | "package_label"
  | "manual_estimate";

export type FibreSourceMethod = "AOAC" | "NSP";

export type IngredientKind =
  | "egg"
  | "cooked_meat"
  | "raw_meat"
  | "fish_seafood"
  | "tofu_legume"
  | "yogurt_dairy"
  | "cheese"
  | "milk"
  | "other_protein"
  | "bread"
  | "pasta"
  | "rice"
  | "noodles"
  | "wrap"
  | "oats"
  | "potato"
  | "grain"
  | "cereal"
  | "other_carb"
  | "vegetable"
  | "fruit"
  | "sauce"
  | "spread"
  | "oil_fat"
  | "nuts_seeds"
  | "composite"
  | "other";

export interface Food {
  id: string;
  referenceFoodId?: string;
  aliases?: string[];
  referenceSourceName?: string;
  referenceSourceId?: string;
  referenceSourceUrl?: string;
  name: string;
  category: FoodCategory;
  /** Culinary identity. Optional so persisted V6 foods remain backward compatible. */
  ingredientKind?: IngredientKind;
  brand?: string;
  store?: string;
  nutritionBasis: NutritionBasis;
  nutrition: Nutrition;
  defaultServing: number;
  servingUnit: ServingUnit;
  gramsPerUnit?: number;
  inStock: boolean;
  regularBuy: boolean;
  favourite: boolean;
  nutritionSource: NutritionSource;
  fibreSourceMethod?: FibreSourceMethod;
  /** Kept for backwards compatibility with Phase 1 persisted data. */
  estimatedNutrition: boolean;
  tags: FoodTag[];
  compatibleMeals: MealType[];
}

export type ReferenceFood = Food & {
  aliases: string[];
  referenceSourceName: string;
  referenceSourceId: string;
  referenceSourceUrl: string;
  nutritionSource: "reference";
  ingredientKind: IngredientKind;
};

export interface FoodPortion {
  food: Food;
  amount: number;
  unit: ServingUnit;
}
