import { describe, expect, it } from "vitest";
import type { Food } from "../types";
import {
  createFoodFormDraft,
  foodFromFormDraft,
  isValidOptionalNumber,
  isValidRequiredNumber,
  parseNumericDraft,
} from "./foodFormDraft";

const existingFood: Food = {
  id: "food-1",
  name: "Label food",
  category: "protein",
  nutritionBasis: "per_100g",
  nutrition: { calories: 120, protein: 12.5, carbs: 4, fat: 3, fibre: 0, sugar: 1.2 },
  defaultServing: 85,
  servingUnit: "g",
  gramsPerUnit: 42.5,
  inStock: false,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  fibreSourceMethod: "AOAC",
  estimatedNutrition: false,
  tags: [],
  compatibleMeals: ["lunch"],
};

describe("Food form numeric drafts", () => {
  it("starts a new food with blank nutrition and serving fields", () => {
    const draft = createFoodFormDraft();
    expect(draft.nutrition).toMatchObject({ calories: "", protein: "", carbs: "", fat: "", fibre: "" });
    expect(draft.defaultServing).toBe("");
  });

  it("keeps an emptied zero as an empty string", () => {
    const draft = createFoodFormDraft(existingFood);
    draft.nutrition.fibre = "";
    expect(draft.nutrition.fibre).toBe("");
    expect(parseNumericDraft(draft.nutrition.fibre)).toBeUndefined();
  });

  it("keeps 12 as typed without a leading zero", () => {
    const draft = createFoodFormDraft();
    draft.nutrition.calories = "12";
    expect(draft.nutrition.calories).toBe("12");
  });

  it("accepts decimal draft values", () => {
    expect(parseNumericDraft("12.5")).toBe(12.5);
  });

  it("converts valid draft values to numbers only on submit", () => {
    const draft = createFoodFormDraft(existingFood);
    draft.nutrition.calories = "140.5";
    draft.defaultServing = "90";
    const food = foodFromFormDraft(draft);
    expect(food.nutrition.calories).toBe(140.5);
    expect(food.defaultServing).toBe(90);
  });

  it("distinguishes required blanks from valid optional blanks", () => {
    expect(isValidRequiredNumber("")).toBe(false);
    expect(isValidOptionalNumber("")).toBe(true);
    expect(isValidRequiredNumber("-1")).toBe(false);
  });

  it("loads existing values as editable strings and allows complete deletion", () => {
    const draft = createFoodFormDraft(existingFood);
    expect(draft.nutrition.calories).toBe("120");
    expect(draft.nutrition.protein).toBe("12.5");
    expect(draft.gramsPerUnit).toBe("42.5");
    draft.nutrition.calories = "";
    expect(isValidRequiredNumber(draft.nutrition.calories)).toBe(false);
  });
});
