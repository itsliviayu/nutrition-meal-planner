import type { FoodCategory } from "./food";
import type { MealType } from "./meal";
import type { ServingUnit } from "./nutrition";

export type ShoppingItemSource =
  | "current_plan"
  | "recipe"
  | "saved_recipe"
  | "manual";

export interface ShoppingItem {
  id: string;
  foodId?: string;
  referenceFoodId?: string;
  displayName: string;
  sources: ShoppingItemSource[];
  createdAt: string;
}

export type ShoppingNeedStatus = "missing" | "stock_status_unavailable";

export interface ShoppingNeed {
  foodId?: string;
  referenceFoodId?: string;
  displayName: string;
  amount?: number;
  unit?: ServingUnit;
  status: ShoppingNeedStatus;
}

export interface PlanNeededFood extends ShoppingNeed {
  foodId: string;
  mealTypes: MealType[];
}

export interface BuyAgainSuggestion {
  foodId: string;
  name: string;
  mealTypes: MealType[];
  recipeCoverage: number;
  score: number;
}

export interface NewFoodSuggestion {
  referenceFoodId: string;
  name: string;
  category: FoodCategory;
  mealTypes: MealType[];
  compatibleTemplateNames: string[];
  score: number;
}
