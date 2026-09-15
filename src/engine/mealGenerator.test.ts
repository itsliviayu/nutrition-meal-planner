import { describe, expect, it } from "vitest";
import type {
  Food,
  GeneratorConstraints,
  MealCandidate,
  MealNutritionTarget,
  RecipeTemplate,
} from "../types";
import { weightedRandomSelect } from "./candidateScoring";
import { buildCandidatePool, createMealVariantKey, generateMeal } from "./mealGenerator";
import { cookingTechniques } from "../data/cookingTechniques";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import { recipeTemplates } from "../data/recipeTemplates";

const food = (id: string, category: Food["category"], overrides: Partial<Food> = {}): Food => ({
  id,
  name: id,
  category,
  ingredientKind: category === "protein"
    ? "raw_meat"
    : category === "carb"
      ? "rice"
      : category === "vegetable"
        ? "vegetable"
        : category === "fruit"
          ? "fruit"
          : category === "fat_sauce"
            ? "sauce"
            : "composite",
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
  id: "rice-bowl",
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

  it("treats a newly bulk-added reference copy as a User Food in free mode but not inventory mode", () => {
    const pittaReference = referenceFoods.find((item) => item.id === "white-pitta")!;
    const bulkAddedPitta = createUserFoodFromReference(pittaReference, {
      id: "bulk-white-pitta",
      inStock: false,
      regularBuy: false,
      favourite: false,
    });
    const foods = [...lunchFoods(), bulkAddedPitta];

    expect(buildCandidatePool(foods, constraints({ inventoryOnly: false })).map((item) => item.id))
      .toContain("bulk-white-pitta");
    expect(buildCandidatePool(foods, constraints({ inventoryOnly: true })).map((item) => item.id))
      .not.toContain("bulk-white-pitta");
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

describe("meal regeneration variants", () => {
  const variantFoods = () => [
    food("egg", "protein", { ingredientKind: "egg" }),
    food("wholemeal-toast", "carb", { ingredientKind: "bread" }),
    food("spinach", "vegetable"),
  ];
  const variantTemplate = template({ id: "eggs-toast-plate" });
  const variantConstraints = constraints({
    allowedEquipment: ["hob"],
    maxCookingTime: 12,
  });
  const ingredientIds = variantFoods().map((item) => item.id);
  const keyFor = (techniqueId: string) => createMealVariantKey(
    variantTemplate.id,
    techniqueId,
    ingredientIds,
  );

  const regenerateFrom = (currentVariantKey: string, recentVariantKeys: string[] = []) => generateMeal({
    foods: variantFoods(),
    constraints: variantConstraints,
    target,
    templates: [variantTemplate],
    regeneration: { currentVariantKey, recentVariantKeys },
    random: () => 0,
  });

  it("does not return the current variant when another valid candidate exists", () => {
    const currentVariantKey = keyFor("scramble");
    const result = regenerateFrom(currentVariantKey);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.didChange).toBe(true);
      expect(result.variantKey).not.toBe(currentVariantKey);
    }
  });

  it("rotates through three available variants before allowing a recent one again", () => {
    const first = keyFor("scramble");
    const secondResult = regenerateFrom(first);
    expect(secondResult.ok).toBe(true);
    if (!secondResult.ok) return;

    const second = secondResult.variantKey;
    const thirdResult = regenerateFrom(second, [first]);
    expect(thirdResult.ok).toBe(true);
    if (!thirdResult.ok) return;

    const third = thirdResult.variantKey;
    expect(new Set([first, second, third]).size).toBe(3);

    const exhaustedResult = regenerateFrom(third, [first, second]);
    expect(exhaustedResult.ok).toBe(true);
    if (exhaustedResult.ok) {
      expect(exhaustedResult.variantKey).not.toBe(third);
      expect([first, second]).toContain(exhaustedResult.variantKey);
    }
  });

  it("keeps the current meal safely when it is the only legal candidate", () => {
    const banana = referenceUserFood("banana");
    const currentVariantKey = createMealVariantKey(
      "relaxed-snack",
      "cold_assemble",
      [banana.id],
    );
    const result = generateMeal({
      foods: [banana],
      constraints: constraints({ mealType: "snack" }),
      target,
      templates: [],
      regeneration: { currentVariantKey },
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.didChange).toBe(false);
      expect(result.variantKey).toBe(currentVariantKey);
    }
  });

  it("continues to preserve locked ingredients and their portions", () => {
    const currentVariantKey = keyFor("scramble");
    const result = generateMeal({
      foods: variantFoods(),
      constraints: constraints({
        allowedEquipment: ["hob"],
        maxCookingTime: 12,
        lockedFoodIds: ["egg"],
      }),
      target,
      templates: [variantTemplate],
      lockedItems: [{ foodId: "egg", amount: 145, unit: "g", locked: true }],
      regeneration: { currentVariantKey },
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.didChange).toBe(true);
      expect(result.meal.items).toContainEqual({
        foodId: "egg",
        amount: 145,
        unit: "g",
        locked: true,
      });
    }
  });
});

const referenceUserFood = (referenceId: string, inStock = true): Food => createUserFoodFromReference(
  referenceFoods.find((item) => item.id === referenceId)!,
  { id: `user-${referenceId}`, inStock },
);

describe("custom IngredientKind generation", () => {
  const ham = () => food("custom-ham", "protein", {
    name: "My Ham",
    ingredientKind: "cooked_meat",
    tags: ["lunch", "savoury", "no_cook"],
  });
  const spinach = () => food("custom-spinach", "vegetable", {
    ingredientKind: "vegetable",
    tags: ["lunch", "savoury", "no_cook", "hob"],
  });

  it("uses a custom pasta base in the standard pasta blueprint", () => {
    const pasta = food("barilla-spaghetti", "carb", { name: "Barilla Spaghetti", ingredientKind: "pasta" });
    const result = generateMeal({
      foods: [pasta, ham(), spinach()],
      constraints: constraints(),
      target,
      templates: recipeTemplates.filter((item) => item.id === "pasta"),
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal).toMatchObject({ recipeTemplateId: "pasta", techniqueId: "pasta_toss" });
  });

  it.each([
    ["microwave-rice", "rice", "rice-bowl", "rice_bowl_assemble"],
    ["large-flatbread", "wrap", "wrap", "wrap_fill"],
  ] as const)("uses custom %s semantics in its matching blueprint", (id, ingredientKind, blueprintId, techniqueId) => {
    const base = food(id, "carb", { ingredientKind });
    const result = generateMeal({
      foods: [base, ham(), spinach()],
      constraints: constraints(),
      target,
      templates: recipeTemplates.filter((item) => item.id === blueprintId),
      random: () => 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.meal.techniqueId).toBe(techniqueId);
  });

  it("forms a relaxed Ham and Spinach Pasta but rejects Milk, Pasta and Banana", () => {
    const pasta = food("custom-pasta", "carb", { ingredientKind: "pasta" });
    const valid = generateMeal({
      foods: [ham(), pasta, spinach()],
      constraints: constraints(),
      target,
      templates: [],
      random: () => 0,
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(valid.meal.techniqueId).toBe("pasta_toss");

    const milk = food("custom-milk", "protein", { ingredientKind: "milk", tags: ["lunch", "no_cook"] });
    const banana = food("custom-banana", "fruit", { ingredientKind: "fruit", tags: ["lunch", "no_cook"] });
    const invalid = generateMeal({
      foods: [milk, pasta, banana],
      constraints: constraints(),
      target,
      templates: [],
      random: () => 0,
    });
    expect(invalid.ok).toBe(false);
  });
});

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
