import { describe, expect, it } from "vitest";
import type {
  Food,
  GeneratorConstraints,
  MealCandidate,
  MealNutritionTarget,
  RecipeTemplate,
} from "../types";
import { weightedRandomSelect } from "./candidateScoring";
import { buildCandidatePool, generateMeal } from "./mealGenerator";
import { cookingTechniques } from "../data/cookingTechniques";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";

const food = (id: string, category: Food["category"], overrides: Partial<Food> = {}): Food => ({
  id,
  name: id,
  category,
  nutritionBasis: "per_100g",
  nutrition: { calories: 100, protein: category === "protein" ? 20 : 3, carbs: 10, fat: 2, fibre: 2 },
  defaultServing: 100,
  servingUnit: "g",
  inStock: true,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  estimatedNutrition: false,
  tags: ["lunch", "savoury"],
  compatibleMeals: ["lunch"],
  ...overrides,
});

const template = (overrides: Partial<RecipeTemplate> = {}): RecipeTemplate => ({
  id: "test-meal",
  name: "Test Meal",
  mealTypes: ["lunch"],
  cookingTime: 10,
  equipment: ["hob"],
  tags: ["lunch", "savoury"],
  slots: [
    { id: "protein", type: "protein", minItems: 1, maxItems: 1, optional: false },
    { id: "carb", type: "carb", minItems: 1, maxItems: 1, optional: false },
    { id: "veg", type: "vegetable", minItems: 1, maxItems: 1, optional: false },
  ],
  nameRule: { ingredientSlotIds: ["protein", "veg"], suffix: "Meal", maxIngredients: 2 },
  instructionSteps: [{ text: "Combine {protein}, {carb} and {veg}." }],
  ...overrides,
});

const constraints = (overrides: Partial<GeneratorConstraints> = {}): GeneratorConstraints => ({
  mealType: "lunch",
  lockedFoodIds: [],
  includedFoodIds: [],
  excludedFoodIds: [],
  inventoryOnly: false,
  maxCookingTime: 20,
  allowedEquipment: ["hob", "microwave", "oven"],
  ...overrides,
});

const target: MealNutritionTarget = {
  calories: { min: 250, max: 500 },
  protein: { min: 20, max: 50 },
};

const lunchFoods = () => [
  food("protein-a", "protein"),
  food("protein-b", "protein"),
  food("carb-a", "carb"),
  food("carb-b", "carb"),
  food("veg-a", "vegetable"),
  food("veg-b", "vegetable"),
];

describe("mealGenerator hard constraints", () => {
  it("rejects direct Reference Foods and only builds from User Foods", () => {
    const directReference = food("reference-protein", "protein", {
      nutritionSource: "reference",
      referenceFoodId: undefined,
    });
    const pool = buildCandidatePool([...lunchFoods(), directReference], constraints());
    expect(pool.map((item) => item.id)).not.toContain("reference-protein");

    const result = generateMeal({ foods: [...lunchFoods(), directReference], constraints: constraints(), target, templates: [template()], random: () => 0.4 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items.map((item) => item.foodId)).not.toContain("reference-protein");
  });

  it("uses only in-stock foods when inventoryOnly is enabled", () => {
    const foods = lunchFoods().map((item) => item.id.endsWith("b") ? { ...item, inStock: false } : item);
    const result = generateMeal({ foods, constraints: constraints({ inventoryOnly: true }), target, templates: [template()], random: () => 0.9 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meal.items.every((item) => foods.find((foodItem) => foodItem.id === item.foodId)?.inStock)).toBe(true);
    }
  });

  it("can use out-of-stock User Foods when planning freely", () => {
    const foods = lunchFoods().map((item) => ({
      ...item,
      inStock: item.category !== "protein",
    }));
    const result = generateMeal({
      foods,
      constraints: constraints({ inventoryOnly: false }),
      target,
      templates: [template()],
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const usedFoods = result.meal.items.map((item) => foods.find((foodItem) => foodItem.id === item.foodId));
      expect(usedFoods.some((item) => item?.inStock === false)).toBe(true);
    }
  });

  it("never includes excluded foods", () => {
    const result = generateMeal({ foods: lunchFoods(), constraints: constraints({ excludedFoodIds: ["protein-a"] }), target, templates: [template()], random: () => 0 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items.map((item) => item.foodId)).not.toContain("protein-a");
  });

  it("always includes explicitly included foods", () => {
    const result = generateMeal({ foods: lunchFoods(), constraints: constraints({ includedFoodIds: ["veg-b"] }), target, templates: [template()], random: () => 0 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items.map((item) => item.foodId)).toContain("veg-b");
  });

  it("preserves a locked food and its portion during regeneration", () => {
    const result = generateMeal({
      foods: lunchFoods(),
      constraints: constraints({ lockedFoodIds: ["protein-b"] }),
      target,
      templates: [template()],
      lockedItems: [{ foodId: "protein-b", amount: 135, unit: "g", locked: true }],
      random: () => 0.2,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items).toContainEqual({ foodId: "protein-b", amount: 135, unit: "g", locked: true });
  });

  it("does not use foods that are incompatible with the requested meal", () => {
    const incompatible = food("breakfast-only", "protein", { compatibleMeals: ["breakfast"], nutrition: { calories: 1, protein: 100, carbs: 0, fat: 0, fibre: 0 } });
    const result = generateMeal({ foods: [...lunchFoods(), incompatible], constraints: constraints(), target, templates: [template()], random: () => 0.8 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items.map((item) => item.foodId)).not.toContain("breakfast-only");
  });

  it("hard-filters cooking time and required equipment", () => {
    const result = generateMeal({
      foods: lunchFoods(),
      constraints: constraints({ maxCookingTime: 5, allowedEquipment: ["microwave"] }),
      target,
      templates: [template({ cookingTime: 10, equipment: ["hob"] })],
      random: () => 0.5,
    });
    expect(result).toMatchObject({ ok: false, reason: "no_valid_combination" });
  });

  it("fails safely when the User Food Library is too small", () => {
    const result = generateMeal({ foods: [food("only-food", "protein")], constraints: constraints(), target, templates: [template()] });
    expect(result).toMatchObject({ ok: false, reason: "insufficient_foods" });
  });
});

describe("weighted random selection", () => {
  const candidate = (id: string, score: number): MealCandidate => ({
    template: template({ id }),
    technique: cookingTechniques[0],
    items: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
    fruitVegPortions: 0,
    fibreDataComplete: true,
    score,
  });

  it("selects by weight while staying inside the top quarter", () => {
    const candidates = [100, 95, 80, 70, 60, 50, 40, 30].map((score, index) => candidate(`candidate-${index}`, score));
    const lowRoll = weightedRandomSelect(candidates, () => 0)?.template.id;
    const highRoll = weightedRandomSelect(candidates, () => 0.99)?.template.id;
    expect([lowRoll, highRoll].every((id) => id === "candidate-0" || id === "candidate-1")).toBe(true);
    expect(new Set([lowRoll, highRoll]).size).toBe(2);
  });
});

const referenceUserFood = (referenceId: string, inStock = true): Food => createUserFoodFromReference(
  referenceFoods.find((item) => item.id === referenceId)!,
  { id: `user-${referenceId}`, inStock },
);

describe("standard-first relaxed composition", () => {
  it("keeps standard blueprints ahead of relaxed candidates when a standard match exists", () => {
    const result = generateMeal({
      foods: [referenceUserFood("chicken-breast"), referenceUserFood("white-rice"), referenceUserFood("broccoli")],
      constraints: constraints(),
      target,
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.recipeTemplateId).not.toBe("relaxed-lunch");
  });

  it("uses a relaxed lunch composition when all standard blueprints fail", () => {
    const result = generateMeal({
      foods: [referenceUserFood("egg"), referenceUserFood("spinach")],
      constraints: constraints(),
      target,
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.meal.recipeTemplateId).toBe("relaxed-lunch");
      expect(["scramble", "omelette", "stir_fry"]).toContain(result.meal.techniqueId);
    }
  });

  it("uses only in-stock User Foods in relaxed inventory generation", () => {
    const available = [referenceUserFood("egg"), referenceUserFood("spinach")];
    const unavailableToast = referenceUserFood("wholemeal-toast", false);
    const result = generateMeal({
      foods: [...available, unavailableToast],
      constraints: constraints({ mealType: "breakfast", inventoryOnly: true }),
      target,
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items.map((item) => item.foodId)).not.toContain(unavailableToast.id);
  });

  it("never lets a direct Reference Food enter relaxed generation", () => {
    const directReference = referenceFoods.find((item) => item.id === "broccoli")!;
    const result = generateMeal({
      foods: [referenceUserFood("egg"), referenceUserFood("spinach"), directReference],
      constraints: constraints(),
      target,
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items.map((item) => item.foodId)).not.toContain(directReference.id);
  });

  it("preserves locked foods and portions in a relaxed candidate", () => {
    const eggFood = referenceUserFood("egg");
    const result = generateMeal({
      foods: [eggFood, referenceUserFood("spinach")],
      constraints: constraints({ lockedFoodIds: [eggFood.id] }),
      lockedItems: [{ foodId: eggFood.id, amount: 145, unit: "g", locked: true }],
      target,
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.items).toContainEqual({ foodId: eggFood.id, amount: 145, unit: "g", locked: true });
  });

  it("creates a meaningful relaxed single-food snack", () => {
    const result = generateMeal({
      foods: [referenceUserFood("banana")],
      constraints: constraints({ mealType: "snack" }),
      target,
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal).toMatchObject({ recipeTemplateId: "relaxed-snack", techniqueId: "cold_assemble" });
  });

  it("does not reject a reasonable sparse meal solely for missing nutrition targets", () => {
    const result = generateMeal({
      foods: [referenceUserFood("egg"), referenceUserFood("spinach")],
      constraints: constraints(),
      target: { calories: { min: 1000, max: 1200 }, protein: { min: 100, max: 120 } },
      random: () => 0,
    });
    expect(result.ok).toBe(true);
  });

  it("returns the clear inventory error when no minimum viable in-stock meal exists", () => {
    const result = generateMeal({
      foods: [referenceUserFood("banana", false)],
      constraints: constraints({ inventoryOnly: true }),
      target,
    });
    expect(result).toMatchObject({
      ok: false,
      message: "There aren’t enough suitable in-stock foods for this meal. Add a few foods or switch to Plan Freely.",
    });
  });
});
