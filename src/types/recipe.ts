import type { FoodCategory, FoodTag } from "./food";
import type { MealItem, MealType } from "./meal";
import type { Nutrition } from "./nutrition";
import type { Equipment } from "./profile";

export interface RecipeSlot {
  id: string;
  type: FoodCategory | "specific";
  allowedFoodIds?: string[];
  allowedTags?: FoodTag[];
  minItems: number;
  maxItems: number;
  optional: boolean;
}

export interface RecipeTemplate {
  id: string;
  name: string;
  mealTypes: MealType[];
  cookingTime: number;
  equipment: Equipment[];
  slots: RecipeSlot[];
  tags: string[];
}

export interface GeneratorPreferences {
  highProtein?: boolean;
  lighterMeal?: boolean;
  sweet?: boolean;
  savoury?: boolean;
}

export interface GeneratorConstraints {
  mealType: MealType;
  lockedFoodIds: string[];
  includedFoodIds: string[];
  excludedFoodIds: string[];
  inventoryOnly: boolean;
  maxCookingTime?: number;
  allowedEquipment: Equipment[];
  preferences?: GeneratorPreferences;
}

export interface MealNutritionTarget {
  calories: { min: number; max: number };
  protein: { min: number; max: number };
  fibre?: { min: number; max: number };
  fruitVegPortions?: { min: number; max: number };
}

export interface MealCandidate {
  template: RecipeTemplate;
  items: MealItem[];
  nutrition: Nutrition;
  fruitVegPortions: number;
  fibreDataComplete: boolean;
  score: number;
}
