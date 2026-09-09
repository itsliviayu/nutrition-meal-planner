import type { Food, FoodPortion, Nutrition, ServingUnit } from "../types";

const NUTRIENT_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
] as const;

const OPTIONAL_NUTRIENT_KEYS = ["sugar", "saturatedFat", "salt"] as const;

const roundNutritionValue = (value: number): number =>
  Math.round((value + Number.EPSILON) * 10) / 10;

const assertValidAmount = (amount: number): void => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("Portion amount must be a finite, non-negative number.");
  }
};

const convertToBasisMultiplier = (
  portion: FoodPortion,
): number => {
  const { food, amount, unit } = portion;
  assertValidAmount(amount);

  if (food.nutritionBasis === "per_unit") {
    if (unit === "piece") return amount;
    if (!food.gramsPerUnit || food.gramsPerUnit <= 0 || unit !== "g") {
      throw new Error(`${food.name} needs gramsPerUnit to convert ${unit} to units.`);
    }
    return amount / food.gramsPerUnit;
  }

  if (food.nutritionBasis === "per_100g") {
    if (unit === "g") return amount / 100;
    if (unit === "piece" && food.gramsPerUnit && food.gramsPerUnit > 0) {
      return (amount * food.gramsPerUnit) / 100;
    }
    throw new Error(`${food.name} cannot convert ${unit} to grams.`);
  }

  if (unit !== "ml") {
    throw new Error(`${food.name} nutrition is based on millilitres.`);
  }
  return amount / 100;
};

export const emptyNutrition = (): Nutrition => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
});

export const calculateFoodNutrition = (portion: FoodPortion): Nutrition => {
  const multiplier = convertToBasisMultiplier(portion);
  const result = emptyNutrition();

  for (const key of NUTRIENT_KEYS) {
    result[key] = roundNutritionValue(portion.food.nutrition[key] * multiplier);
  }

  if (hasComparableFibre(portion.food)) {
    result.fibre = roundNutritionValue(portion.food.nutrition.fibre! * multiplier);
  } else {
    delete result.fibre;
  }

  for (const key of OPTIONAL_NUTRIENT_KEYS) {
    const value = portion.food.nutrition[key];
    if (value !== undefined) result[key] = roundNutritionValue(value * multiplier);
  }

  return result;
};

const sumNutrition = (items: Nutrition[]): Nutrition => {
  const result = emptyNutrition();

  for (const item of items) {
    for (const key of NUTRIENT_KEYS) result[key] += item[key];
    if (item.fibre !== undefined) result.fibre = (result.fibre ?? 0) + item.fibre;
    for (const key of OPTIONAL_NUTRIENT_KEYS) {
      const value = item[key];
      if (value !== undefined) result[key] = (result[key] ?? 0) + value;
    }
  }

  for (const key of NUTRIENT_KEYS) result[key] = roundNutritionValue(result[key]);
  result.fibre = roundNutritionValue(result.fibre ?? 0);
  for (const key of OPTIONAL_NUTRIENT_KEYS) {
    if (result[key] !== undefined) result[key] = roundNutritionValue(result[key]);
  }
  return result;
};

export const hasComparableFibre = (food: Food): boolean =>
  food.nutrition.fibre !== undefined
  && (
    food.fibreSourceMethod === "AOAC"
    || (food.fibreSourceMethod === undefined && food.nutritionSource === "package_label")
  );

export const calculateMealNutrition = (portions: FoodPortion[]): Nutrition =>
  sumNutrition(portions.map(calculateFoodNutrition));

export const calculateDailyNutrition = (
  meals: FoodPortion[][],
): Nutrition => sumNutrition(meals.map(calculateMealNutrition));

export const isServingUnitCompatible = (
  basis: FoodPortion["food"]["nutritionBasis"],
  unit: ServingUnit,
  gramsPerUnit?: number,
): boolean => {
  if (basis === "per_100ml") return unit === "ml";
  if (basis === "per_unit") return unit === "piece" || (unit === "g" && !!gramsPerUnit);
  return unit === "g" || (unit === "piece" && !!gramsPerUnit);
};
