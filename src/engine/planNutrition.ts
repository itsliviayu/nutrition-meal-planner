import type {
  DailyNutritionStatus,
  DailyPlan,
  Food,
  FoodPortion,
  MealItem,
  MealPlan,
  Nutrition,
  TargetRange,
  TargetStatus,
  UserProfile,
} from "../types";
import {
  calculateDailyNutrition,
  calculateMealNutrition,
  hasComparableFibre,
} from "./nutritionCalculator";

const roundOne = (value: number): number => Math.round(value * 10) / 10;

export const resolveMealPortions = (
  items: MealItem[],
  foods: Food[],
): FoodPortion[] => items.flatMap((item) => {
  const food = foods.find((candidate) => candidate.id === item.foodId);
  return food ? [{ food, amount: item.amount, unit: item.unit }] : [];
});

const portionWeightInGrams = (portion: FoodPortion): number | undefined => {
  if (portion.unit === "g") return portion.amount;
  if (portion.unit === "piece" && portion.food.gramsPerUnit) {
    return portion.amount * portion.food.gramsPerUnit;
  }
  return undefined;
};

export const calculateFruitVegPortions = (portions: FoodPortion[]): number =>
  roundOne(portions.reduce((total, portion) => {
    if (portion.food.category !== "fruit" && portion.food.category !== "vegetable") return total;
    const grams = portionWeightInGrams(portion);
    return grams === undefined ? total : total + grams / 80;
  }, 0));

export const isFibreDataComplete = (portions: FoodPortion[]): boolean =>
  portions.every(({ food }) => hasComparableFibre(food));

export const recalculateMealPlan = (
  meal: MealPlan,
  foods: Food[],
): MealPlan => {
  const portions = resolveMealPortions(meal.items, foods);
  return { ...meal, nutrition: calculateMealNutrition(portions) };
};

const rangeStatus = (value: number, target: TargetRange): TargetStatus => {
  if (value >= target.min && value <= target.max) return "good";
  if (value < target.min) return value >= target.min * 0.9 ? "close" : "low";
  return value <= target.max * 1.1 ? "close" : "high";
};

const minimumStatus = (value: number, target: number): TargetStatus => {
  if (value >= target) return "good";
  if (value >= target * 0.8) return "close";
  return "low";
};

export const calculateDailyNutritionStatus = (
  nutrition: Nutrition,
  fruitVegPortions: number,
  fibreDataComplete: boolean,
  profile: UserProfile,
): DailyNutritionStatus => ({
  calories: rangeStatus(nutrition.calories, profile.calorieTarget),
  protein: rangeStatus(nutrition.protein, profile.proteinTarget),
  fibre: fibreDataComplete
    ? minimumStatus(nutrition.fibre ?? 0, profile.fibreTarget)
    : "partial",
  fruitVeg: minimumStatus(fruitVegPortions, profile.fruitVegTargetPortions),
});

export const recalculateDailyPlan = (
  plan: Pick<DailyPlan, "date" | "breakfast" | "lunch" | "snack">,
  foods: Food[],
  profile: UserProfile,
): DailyPlan => {
  const breakfast = recalculateMealPlan(plan.breakfast, foods);
  const lunch = recalculateMealPlan(plan.lunch, foods);
  const snack = recalculateMealPlan(plan.snack, foods);
  const mealPortions = [breakfast, lunch, snack].map((meal) =>
    resolveMealPortions(meal.items, foods));
  const flatPortions = mealPortions.flat();
  const totalNutrition = calculateDailyNutrition(mealPortions);
  const fruitVegPortions = calculateFruitVegPortions(flatPortions);
  const fibreDataComplete = isFibreDataComplete(flatPortions);

  return {
    ...plan,
    breakfast,
    lunch,
    snack,
    totalNutrition,
    fruitVegPortions,
    fibreDataComplete,
    nutritionStatus: calculateDailyNutritionStatus(
      totalNutrition,
      fruitVegPortions,
      fibreDataComplete,
      profile,
    ),
  };
};

export const updateMealItemPortion = (
  plan: DailyPlan,
  mealType: MealPlan["type"],
  foodId: string,
  amount: number,
  foods: Food[],
  profile: UserProfile,
): DailyPlan => {
  if (!Number.isFinite(amount) || amount <= 0) return plan;
  const meal = plan[mealType];
  const updatedMeal = {
    ...meal,
    items: meal.items.map((item) => item.foodId === foodId ? { ...item, amount } : item),
  };
  return recalculateDailyPlan({ ...plan, [mealType]: updatedMeal }, foods, profile);
};
