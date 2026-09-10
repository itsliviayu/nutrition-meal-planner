import type { FoodCategory, FoodTag } from "./food";
import type { MealItem, MealType } from "./meal";
import type { Nutrition, ServingUnit } from "./nutrition";
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
  nameRule: RecipeNameRule;
  instructionSteps: RecipeInstructionStep[];
  tags: string[];
}

export interface RecipeNameRule {
  ingredientSlotIds: string[];
  suffix: string;
  maxIngredients: number;
}

export interface RecipeInstructionStep {
  text: string;
  whenSlotsPresent?: string[];
}

export interface RecipeIngredientSnapshot {
  foodId: string;
  foodName: string;
  amount: number;
  unit: ServingUnit;
}

export interface GeneratedRecipeIngredient extends RecipeIngredientSnapshot {
  category: FoodCategory;
  inStock: boolean;
  locked: boolean;
  slotId?: string;
}

export interface GeneratedRecipe {
  name: string;
  sourceTemplateId: string;
  mealType: MealType;
  ingredients: GeneratedRecipeIngredient[];
  cookingTime: number;
  equipment: Equipment[];
  instructions: string[];
  nutrition: Nutrition;
  fibreDataComplete: boolean;
}

export interface SavedRecipe {
  id: string;
  name: string;
  sourceTemplateId: string;
  mealType: MealType;
  ingredients: RecipeIngredientSnapshot[];
  cookingTime: number;
  equipment: Equipment[];
  instructions: string[];
  nutrition: Nutrition;
  fibreDataComplete: boolean;
  createdAt: string;
  updatedAt?: string;
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
