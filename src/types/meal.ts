import type { ServingUnit } from "./nutrition";

export type MealType = "breakfast" | "lunch" | "snack";

export interface MealItem {
  foodId: string;
  amount: number;
  unit: ServingUnit;
  locked: boolean;
}
