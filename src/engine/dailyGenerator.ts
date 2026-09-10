import type {
  DailyPlan,
  Food,
  GeneratorConstraints,
  MealNutritionTarget,
  MealPlan,
  MealType,
  Nutrition,
  UserProfile,
} from "../types";
import { generateMeal, type MealGenerationFailureReason } from "./mealGenerator";
import { calculateFruitVegPortions, recalculateDailyPlan, resolveMealPortions } from "./planNutrition";

export type DailyGenerationResult =
  | { ok: true; plan: DailyPlan }
  | { ok: false; reason: MealGenerationFailureReason; message: string };

export interface GenerateDailyPlanInput {
  foods: Food[];
  profile: UserProfile;
  inventoryOnly: boolean;
  recentFoodIds?: string[];
  recentRecipeTemplateIds?: string[];
  date?: Date;
  random?: () => number;
}

const roundOne = (value: number): number => Math.round(value * 10) / 10;

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fractionTarget = (
  profile: UserProfile,
  calorieRange: [number, number],
  proteinRange: [number, number],
  fibreRange: [number, number],
  produceRange: [number, number],
): MealNutritionTarget => ({
  calories: {
    min: profile.calorieTarget.min * calorieRange[0],
    max: profile.calorieTarget.max * calorieRange[1],
  },
  protein: {
    min: profile.proteinTarget.min * proteinRange[0],
    max: profile.proteinTarget.max * proteinRange[1],
  },
  fibre: {
    min: profile.fibreTarget * fibreRange[0],
    max: profile.fibreTarget * fibreRange[1],
  },
  fruitVegPortions: {
    min: profile.fruitVegTargetPortions * produceRange[0],
    max: profile.fruitVegTargetPortions * produceRange[1],
  },
});

const lunchTargetAfterBreakfast = (
  profile: UserProfile,
  breakfast: MealPlan,
): MealNutritionTarget => {
  const remainingCaloriesMin = Math.max(0, profile.calorieTarget.min - breakfast.nutrition.calories);
  const remainingCaloriesMax = Math.max(remainingCaloriesMin, profile.calorieTarget.max - breakfast.nutrition.calories);
  const remainingProteinMin = Math.max(0, profile.proteinTarget.min - breakfast.nutrition.protein);
  const remainingProteinMax = Math.max(remainingProteinMin, profile.proteinTarget.max - breakfast.nutrition.protein);
  return {
    calories: { min: remainingCaloriesMin * 0.55, max: remainingCaloriesMax * 0.72 },
    protein: { min: remainingProteinMin * 0.6, max: Math.max(remainingProteinMin * 0.6, remainingProteinMax * 0.8) },
    fibre: { min: profile.fibreTarget * 0.35, max: profile.fibreTarget * 0.65 },
    fruitVegPortions: { min: profile.fruitVegTargetPortions * 0.4, max: profile.fruitVegTargetPortions * 0.75 },
  };
};

const sumNutrition = (meals: MealPlan[]): Nutrition => ({
  calories: roundOne(meals.reduce((sum, meal) => sum + meal.nutrition.calories, 0)),
  protein: roundOne(meals.reduce((sum, meal) => sum + meal.nutrition.protein, 0)),
  carbs: roundOne(meals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0)),
  fat: roundOne(meals.reduce((sum, meal) => sum + meal.nutrition.fat, 0)),
  fibre: roundOne(meals.reduce((sum, meal) => sum + (meal.nutrition.fibre ?? 0), 0)),
});

const snackTargetForGaps = (
  profile: UserProfile,
  currentNutrition: Nutrition,
  currentFruitVeg: number,
): MealNutritionTarget => {
  const calorieMin = Math.max(80, profile.calorieTarget.min - currentNutrition.calories);
  const calorieMax = Math.max(calorieMin + 20, profile.calorieTarget.max - currentNutrition.calories);
  const proteinMin = Math.max(0, profile.proteinTarget.min - currentNutrition.protein);
  const proteinMax = Math.max(proteinMin + 4, profile.proteinTarget.max - currentNutrition.protein);
  const fibreMin = Math.max(0, profile.fibreTarget - (currentNutrition.fibre ?? 0));
  const produceMin = Math.max(0, profile.fruitVegTargetPortions - currentFruitVeg);
  return {
    calories: { min: calorieMin, max: calorieMax },
    protein: { min: proteinMin, max: proteinMax },
    fibre: { min: fibreMin, max: fibreMin + 4 },
    fruitVegPortions: { min: produceMin, max: produceMin + 1.5 },
  };
};

const baseConstraints = (
  mealType: MealType,
  profile: UserProfile,
  inventoryOnly: boolean,
): GeneratorConstraints => ({
  mealType,
  lockedFoodIds: [],
  includedFoodIds: [],
  excludedFoodIds: [],
  inventoryOnly,
  maxCookingTime: profile.defaultMaxCookingTime,
  allowedEquipment: profile.equipment,
});

export const generateDailyPlan = ({
  foods,
  profile,
  inventoryOnly,
  recentFoodIds = [],
  recentRecipeTemplateIds = [],
  date = new Date(),
  random = Math.random,
}: GenerateDailyPlanInput): DailyGenerationResult => {
  const breakfastResult = generateMeal({
    foods,
    constraints: baseConstraints("breakfast", profile, inventoryOnly),
    target: fractionTarget(profile, [0.23, 0.34], [0.22, 0.36], [0.15, 0.35], [0.2, 0.45]),
    recentFoodIds,
    recentRecipeTemplateIds,
    random,
  });
  if (!breakfastResult.ok) return breakfastResult;

  const breakfastFoods = breakfastResult.meal.items.map((item) => item.foodId);
  const lunchResult = generateMeal({
    foods,
    constraints: baseConstraints("lunch", profile, inventoryOnly),
    target: lunchTargetAfterBreakfast(profile, breakfastResult.meal),
    recentFoodIds: [...recentFoodIds, ...breakfastFoods],
    recentRecipeTemplateIds: [...recentRecipeTemplateIds, breakfastResult.meal.recipeTemplateId],
    random,
  });
  if (!lunchResult.ok) return lunchResult;

  const firstMeals = [breakfastResult.meal, lunchResult.meal];
  const currentNutrition = sumNutrition(firstMeals);
  const currentFruitVeg = calculateFruitVegPortions(
    firstMeals.flatMap((meal) => resolveMealPortions(meal.items, foods)),
  );
  const snackConstraints = baseConstraints("snack", profile, inventoryOnly);
  snackConstraints.preferences = {
    highProtein: currentNutrition.protein < profile.proteinTarget.min,
    lighterMeal: currentNutrition.calories >= profile.calorieTarget.min,
  };
  const snackResult = generateMeal({
    foods,
    constraints: snackConstraints,
    target: snackTargetForGaps(profile, currentNutrition, currentFruitVeg),
    recentFoodIds: [...recentFoodIds, ...firstMeals.flatMap((meal) => meal.items.map((item) => item.foodId))],
    recentRecipeTemplateIds: [...recentRecipeTemplateIds, ...firstMeals.map((meal) => meal.recipeTemplateId)],
    random,
  });
  if (!snackResult.ok) return snackResult;

  return {
    ok: true,
    plan: recalculateDailyPlan({
      date: dateKey(date),
      breakfast: breakfastResult.meal,
      lunch: lunchResult.meal,
      snack: snackResult.meal,
    }, foods, profile),
  };
};

export const targetForMealRegeneration = (
  plan: DailyPlan,
  mealType: MealType,
  profile: UserProfile,
): MealNutritionTarget => {
  const otherMeals = (["breakfast", "lunch", "snack"] as MealType[])
    .filter((type) => type !== mealType)
    .map((type) => plan[type]);
  const otherNutrition = sumNutrition(otherMeals);
  const calorieMin = Math.max(80, profile.calorieTarget.min - otherNutrition.calories);
  const calorieMax = Math.max(calorieMin + 20, profile.calorieTarget.max - otherNutrition.calories);
  const proteinMin = Math.max(0, profile.proteinTarget.min - otherNutrition.protein);
  const proteinMax = Math.max(proteinMin + 4, profile.proteinTarget.max - otherNutrition.protein);
  const fibreMin = Math.max(0, profile.fibreTarget - (otherNutrition.fibre ?? 0));
  return {
    calories: { min: calorieMin, max: calorieMax },
    protein: { min: proteinMin, max: proteinMax },
    fibre: { min: fibreMin, max: fibreMin + 5 },
    fruitVegPortions: { min: 0, max: profile.fruitVegTargetPortions },
  };
};
