import type { Nutrition, ServingUnit } from "./nutrition";
import type { Equipment } from "./profile";
import type { CookingTechniqueId } from "./recipe";

export type MealType = "breakfast" | "lunch" | "snack";

export interface MealItem {
  foodId: string;
  amount: number;
  unit: ServingUnit;
  locked: boolean;
}

export interface MealPlan {
  id: string;
  type: MealType;
  name: string;
  items: MealItem[];
  recipeTemplateId: string;
  techniqueId?: CookingTechniqueId;
  nutrition: Nutrition;
  cookingTime: number;
  equipment: Equipment[];
}

export type TargetStatus = "good" | "close" | "low" | "high" | "partial";

export interface DailyNutritionStatus {
  calories: TargetStatus;
  protein: TargetStatus;
  fibre: TargetStatus;
  fruitVeg: TargetStatus;
}

export interface DailyPlan {
  date: string;
  breakfast: MealPlan;
  lunch: MealPlan;
  snack: MealPlan;
  totalNutrition: Nutrition;
  fruitVegPortions: number;
  nutritionStatus: DailyNutritionStatus;
  fibreDataComplete: boolean;
}
