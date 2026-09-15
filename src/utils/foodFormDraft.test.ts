import { describe, expect, it } from "vitest";
import type { Food } from "../types";
import {
  changeDraftNutritionSource,
  createFoodFormDraft,
  foodFromFormDraft,
  isNutritionEditable,
  isValidOptionalNumber,
  isValidRequiredNumber,
  parseNumericDraft,
  restoreDraftReferenceNutrition,
} from "./foodFormDraft";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";

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
    expect(draft.ingredientKind).toBe("other_protein");
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

describe("Reference-linked Food form drafts", () => {
  const milkReference = referenceFoods.find((food) => food.id === "semi-skimmed-milk")!;
  const linkedFood = createUserFoodFromReference(milkReference, {
    id: "user-milk",
    name: "Tesco 半脱脂牛奶",
    defaultServing: 250,
    store: "Tesco",
    inStock: true,
    regularBuy: true,
    favourite: true,
  });

  it("keeps reference nutrition locked while identity and serving fields remain ordinary draft values", () => {
    const draft = createFoodFormDraft(linkedFood);
    draft.name = "早餐牛奶";
    draft.defaultServing = "300";

    expect(isNutritionEditable(draft)).toBe(false);
    expect(draft).toMatchObject({
      name: "早餐牛奶",
      defaultServing: "300",
      referenceFoodId: "semi-skimmed-milk",
      nutritionSource: "reference",
      ingredientKind: "milk",
    });
  });

  it.each(["package_label", "manual_estimate"] as const)("switches to %s without losing reference ancestry", (source) => {
    const draft = changeDraftNutritionSource(createFoodFormDraft(linkedFood), source);
    draft.nutrition.calories = "50";

    expect(isNutritionEditable(draft)).toBe(true);
    expect(draft.referenceFoodId).toBe("semi-skimmed-milk");
    expect(draft.nutritionSource).toBe(source);
    expect(draft.nutrition.calories).toBe("50");
  });

  it("restores official nutrition and provenance without overwriting User Food identity or preferences", () => {
    const customized = changeDraftNutritionSource(createFoodFormDraft(linkedFood), "package_label");
    customized.nutrition.calories = "999";
    customized.nutritionBasis = "per_unit";
    customized.name = "早餐牛奶";
    customized.brand = "Tesco";
    customized.defaultServing = "300";
    customized.tags = ["breakfast", "quick"];
    customized.compatibleMeals = ["breakfast"];
    customized.ingredientKind = "yogurt_dairy";

    const restored = restoreDraftReferenceNutrition(customized, milkReference);

    expect(restored.nutritionSource).toBe("reference");
    expect(foodFromFormDraft(restored).nutrition).toEqual(milkReference.nutrition);
    expect(restored.nutritionBasis).toBe(milkReference.nutritionBasis);
    expect(restored.fibreSourceMethod).toBe(milkReference.fibreSourceMethod);
    expect(restored).toMatchObject({
      name: "早餐牛奶",
      brand: "Tesco",
      defaultServing: "300",
      tags: ["breakfast", "quick"],
      compatibleMeals: ["breakfast"],
      referenceFoodId: "semi-skimmed-milk",
      referenceSourceId: milkReference.referenceSourceId,
      ingredientKind: "yogurt_dairy",
    });
  });

  it("leaves a pure Custom Food workflow editable and unlinked", () => {
    const draft = createFoodFormDraft();
    expect(isNutritionEditable(draft)).toBe(true);
    expect(draft.nutritionSource).toBe("package_label");
    expect(draft.referenceFoodId).toBeUndefined();
  });
});
