export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
  sugar?: number;
  saturatedFat?: number;
  salt?: number;
}

export type NutritionBasis = "per_100g" | "per_100ml" | "per_unit";
export type ServingUnit = "g" | "ml" | "piece";
