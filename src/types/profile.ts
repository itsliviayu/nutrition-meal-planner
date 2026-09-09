export type Goal = "fat_loss" | "maintenance" | "muscle_gain";
export type Equipment = "hob" | "oven" | "microwave" | "fridge";

export interface TargetRange {
  min: number;
  max: number;
}

export interface UserProfile {
  id: string;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  goal: Goal;
  calorieTarget: TargetRange;
  proteinTarget: TargetRange;
  fibreTarget: number;
  fruitVegTargetPortions: number;
  equipment: Equipment[];
  defaultMaxCookingTime: number;
}
