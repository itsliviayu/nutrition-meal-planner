import type { UserProfile } from "../types";

export const defaultProfile: UserProfile = {
  id: "local-user",
  heightCm: 171,
  weightKg: 60,
  goalWeightKg: 55,
  goal: "fat_loss",
  calorieTarget: { min: 1600, max: 1750 },
  proteinTarget: { min: 80, max: 100 },
  fibreTarget: 30,
  fruitVegTargetPortions: 5,
  equipment: ["hob", "oven", "microwave"],
  defaultMaxCookingTime: 30,
};
