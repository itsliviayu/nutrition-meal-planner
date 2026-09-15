import type { Food, Nutrition, NutritionSource, ReferenceFood } from "../types";
import { defaultIngredientKindForCategory } from "../data/ingredientKinds";

export type NumericDraft = string;

export interface NutritionFormDraft {
  calories: NumericDraft;
  protein: NumericDraft;
  carbs: NumericDraft;
  fat: NumericDraft;
  fibre: NumericDraft;
  sugar: NumericDraft;
  saturatedFat: NumericDraft;
  salt: NumericDraft;
}

export type FoodFormDraft = Omit<Food, "nutrition" | "defaultServing" | "gramsPerUnit"> & {
  nutrition: NutritionFormDraft;
  defaultServing: NumericDraft;
  gramsPerUnit: NumericDraft;
};

const numberText = (value: number | undefined): string => value === undefined ? "" : String(value);

export const createFoodFormDraft = (food?: Food): FoodFormDraft => food ? {
  ...structuredClone(food),
  nutrition: {
    calories: numberText(food.nutrition.calories),
    protein: numberText(food.nutrition.protein),
    carbs: numberText(food.nutrition.carbs),
    fat: numberText(food.nutrition.fat),
    fibre: numberText(food.nutrition.fibre),
    sugar: numberText(food.nutrition.sugar),
    saturatedFat: numberText(food.nutrition.saturatedFat),
    salt: numberText(food.nutrition.salt),
  },
  defaultServing: numberText(food.defaultServing),
  gramsPerUnit: numberText(food.gramsPerUnit),
} : {
  id: "",
  name: "",
  category: "protein",
  ingredientKind: defaultIngredientKindForCategory("protein"),
  nutritionBasis: "per_100g",
  nutrition: { calories: "", protein: "", carbs: "", fat: "", fibre: "", sugar: "", saturatedFat: "", salt: "" },
  defaultServing: "",
  servingUnit: "g",
  gramsPerUnit: "",
  inStock: false,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  fibreSourceMethod: "AOAC",
  estimatedNutrition: false,
  tags: [],
  compatibleMeals: ["lunch"],
};

export const parseNumericDraft = (value: NumericDraft): number | undefined => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const isValidRequiredNumber = (value: NumericDraft, minimum = 0): boolean => {
  const parsed = parseNumericDraft(value);
  return parsed !== undefined && parsed >= minimum;
};

export const isValidOptionalNumber = (value: NumericDraft, minimum = 0): boolean =>
  value.trim() === "" || isValidRequiredNumber(value, minimum);

export const foodFromFormDraft = (draft: FoodFormDraft): Food => {
  const nutrition: Nutrition = {
    calories: parseNumericDraft(draft.nutrition.calories)!,
    protein: parseNumericDraft(draft.nutrition.protein)!,
    carbs: parseNumericDraft(draft.nutrition.carbs)!,
    fat: parseNumericDraft(draft.nutrition.fat)!,
    fibre: parseNumericDraft(draft.nutrition.fibre),
    sugar: parseNumericDraft(draft.nutrition.sugar),
    saturatedFat: parseNumericDraft(draft.nutrition.saturatedFat),
    salt: parseNumericDraft(draft.nutrition.salt),
  };
  return {
    ...draft,
    nutrition,
    defaultServing: parseNumericDraft(draft.defaultServing)!,
    gramsPerUnit: parseNumericDraft(draft.gramsPerUnit),
  };
};

export const foodPreviewFromDraft = (draft: FoodFormDraft): Food => ({
  ...draft,
  nutrition: {
    calories: parseNumericDraft(draft.nutrition.calories) ?? 0,
    protein: parseNumericDraft(draft.nutrition.protein) ?? 0,
    carbs: parseNumericDraft(draft.nutrition.carbs) ?? 0,
    fat: parseNumericDraft(draft.nutrition.fat) ?? 0,
    fibre: parseNumericDraft(draft.nutrition.fibre),
    sugar: parseNumericDraft(draft.nutrition.sugar),
    saturatedFat: parseNumericDraft(draft.nutrition.saturatedFat),
    salt: parseNumericDraft(draft.nutrition.salt),
  },
  defaultServing: parseNumericDraft(draft.defaultServing) ?? 0,
  gramsPerUnit: parseNumericDraft(draft.gramsPerUnit),
});

export const isNutritionEditable = (draft: Pick<FoodFormDraft, "nutritionSource">): boolean =>
  draft.nutritionSource !== "reference";

export const changeDraftNutritionSource = (
  draft: FoodFormDraft,
  nutritionSource: NutritionSource,
): FoodFormDraft => ({
  ...draft,
  nutritionSource,
  estimatedNutrition: nutritionSource !== "package_label",
  fibreSourceMethod: nutritionSource === "manual_estimate" || draft.nutrition.fibre.trim() === ""
    ? undefined
    : nutritionSource === "package_label"
      ? "AOAC"
      : draft.fibreSourceMethod,
});

export const restoreDraftReferenceNutrition = (
  draft: FoodFormDraft,
  referenceFood: ReferenceFood,
): FoodFormDraft => {
  const referenceDraft = createFoodFormDraft(referenceFood);
  return {
    ...draft,
    referenceFoodId: referenceFood.id,
    aliases: [...referenceFood.aliases],
    referenceSourceName: referenceFood.referenceSourceName,
    referenceSourceId: referenceFood.referenceSourceId,
    referenceSourceUrl: referenceFood.referenceSourceUrl,
    nutritionSource: "reference",
    estimatedNutrition: true,
    nutritionBasis: referenceDraft.nutritionBasis,
    nutrition: { ...referenceDraft.nutrition },
    fibreSourceMethod: referenceFood.fibreSourceMethod,
    servingUnit: referenceDraft.servingUnit,
    gramsPerUnit: referenceDraft.gramsPerUnit,
  };
};
