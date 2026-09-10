import { recipeTemplates } from "../data/recipeTemplates";
import type {
  Food,
  GeneratorConstraints,
  MealCandidate,
  MealItem,
  MealNutritionTarget,
  MealPlan,
  RecipeSlot,
  RecipeTemplate,
} from "../types";
import { createId } from "../utils/id";
import { scoreCandidates, weightedRandomSelect } from "./candidateScoring";
import {
  calculateFruitVegPortions,
  isFibreDataComplete,
  resolveMealPortions,
} from "./planNutrition";
import { calculateMealNutrition } from "./nutritionCalculator";

export type MealGenerationFailureReason = "insufficient_foods" | "no_valid_combination";

export type MealGenerationResult =
  | { ok: true; meal: MealPlan; candidateCount: number }
  | { ok: false; reason: MealGenerationFailureReason; message: string };

export interface GenerateMealInput {
  foods: Food[];
  constraints: GeneratorConstraints;
  target: MealNutritionTarget;
  templates?: RecipeTemplate[];
  lockedItems?: MealItem[];
  recentFoodIds?: string[];
  recentRecipeTemplateIds?: string[];
  candidateCount?: number;
  random?: () => number;
}

const isDirectReferenceFood = (food: Food): boolean =>
  food.nutritionSource === "reference" && !food.referenceFoodId;

const matchesAllowedId = (food: Food, allowedFoodIds: string[]): boolean =>
  allowedFoodIds.includes(food.id)
  || (!!food.referenceFoodId && allowedFoodIds.includes(food.referenceFoodId));

export const foodMatchesSlot = (food: Food, slot: RecipeSlot): boolean => {
  if (slot.type !== "specific" && food.category !== slot.type) return false;
  if (slot.allowedFoodIds && !matchesAllowedId(food, slot.allowedFoodIds)) return false;
  if (slot.allowedTags && !slot.allowedTags.every((tag) => food.tags.includes(tag))) return false;
  return true;
};

export const filterTemplates = (
  templates: RecipeTemplate[],
  constraints: GeneratorConstraints,
): RecipeTemplate[] => templates.filter((template) =>
  template.mealTypes.includes(constraints.mealType)
  && (constraints.maxCookingTime === undefined || template.cookingTime <= constraints.maxCookingTime)
  && template.equipment.every((item) => constraints.allowedEquipment.includes(item)),
);

export const buildCandidatePool = (
  foods: Food[],
  constraints: GeneratorConstraints,
): Food[] => foods.filter((food) =>
  !isDirectReferenceFood(food)
  && food.compatibleMeals.includes(constraints.mealType)
  && !constraints.excludedFoodIds.includes(food.id)
  && (!constraints.inventoryOnly || food.inStock),
);

const assignRequiredFoods = (
  template: RecipeTemplate,
  requiredFoods: Food[],
): Food[][] | undefined => {
  const allocations = template.slots.map(() => [] as Food[]);
  const orderedFoods = [...requiredFoods].sort((a, b) => {
    const aOptions = template.slots.filter((slot) => foodMatchesSlot(a, slot)).length;
    const bOptions = template.slots.filter((slot) => foodMatchesSlot(b, slot)).length;
    return aOptions - bOptions;
  });

  const assign = (foodIndex: number): boolean => {
    if (foodIndex >= orderedFoods.length) return true;
    const food = orderedFoods[foodIndex];
    for (let slotIndex = 0; slotIndex < template.slots.length; slotIndex += 1) {
      const slot = template.slots[slotIndex];
      if (!foodMatchesSlot(food, slot) || allocations[slotIndex].length >= slot.maxItems) continue;
      allocations[slotIndex].push(food);
      if (assign(foodIndex + 1)) return true;
      allocations[slotIndex].pop();
    }
    return false;
  };

  return assign(0) ? allocations : undefined;
};

const randomIndex = (length: number, random: () => number): number =>
  Math.min(length - 1, Math.max(0, Math.floor(random() * length)));

const fillTemplateSlots = (
  template: RecipeTemplate,
  pool: Food[],
  requiredFoods: Food[],
  random: () => number,
): Food[] | undefined => {
  const allocations = assignRequiredFoods(template, requiredFoods);
  if (!allocations) return undefined;
  const selectedIds = new Set(requiredFoods.map((food) => food.id));

  for (let slotIndex = 0; slotIndex < template.slots.length; slotIndex += 1) {
    const slot = template.slots[slotIndex];
    const allocation = allocations[slotIndex];
    const optionalExtra = slot.optional && slot.maxItems > allocation.length && random() < 0.55 ? 1 : 0;
    const variableExtra = !slot.optional && slot.maxItems > slot.minItems
      ? Math.floor(random() * (slot.maxItems - slot.minItems + 1))
      : 0;
    const targetCount = Math.max(allocation.length, Math.min(slot.maxItems, slot.minItems + optionalExtra + variableExtra));

    while (allocation.length < targetCount) {
      const choices = pool.filter((food) => !selectedIds.has(food.id) && foodMatchesSlot(food, slot));
      if (choices.length === 0) break;
      const selected = choices[randomIndex(choices.length, random)];
      allocation.push(selected);
      selectedIds.add(selected.id);
    }
    if (allocation.length < slot.minItems) return undefined;
  }

  return allocations.flat();
};

export const calculateCandidateNutrition = (
  items: MealItem[],
  foods: Food[],
): Pick<MealCandidate, "nutrition" | "fruitVegPortions" | "fibreDataComplete"> => {
  const portions = resolveMealPortions(items, foods);
  return {
    nutrition: calculateMealNutrition(portions),
    fruitVegPortions: calculateFruitVegPortions(portions),
    fibreDataComplete: isFibreDataComplete(portions),
  };
};

const buildCandidate = (
  template: RecipeTemplate,
  pool: Food[],
  requiredFoods: Food[],
  lockedItems: MealItem[],
  random: () => number,
): MealCandidate | undefined => {
  const selectedFoods = fillTemplateSlots(template, pool, requiredFoods, random);
  if (!selectedFoods) return undefined;
  const lockedById = new Map(lockedItems.map((item) => [item.foodId, item]));
  const items = selectedFoods.map((food): MealItem => {
    const lockedItem = lockedById.get(food.id);
    return lockedItem
      ? { ...lockedItem, locked: true }
      : { foodId: food.id, amount: food.defaultServing, unit: food.servingUnit, locked: false };
  });
  return {
    template,
    items,
    ...calculateCandidateNutrition(items, pool),
    score: 0,
  };
};

export const generateCandidates = (
  templates: RecipeTemplate[],
  pool: Food[],
  requiredFoods: Food[],
  lockedItems: MealItem[],
  attempts: number,
  random: () => number,
): MealCandidate[] => {
  if (templates.length === 0) return [];
  const candidates = new Map<string, MealCandidate>();
  const startIndex = templates.length ? randomIndex(templates.length, random) : 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const template = templates[(startIndex + attempt) % templates.length];
    const candidate = buildCandidate(template, pool, requiredFoods, lockedItems, random);
    if (!candidate) continue;
    const key = `${template.id}:${candidate.items.map((item) => item.foodId).sort().join(",")}`;
    candidates.set(key, candidate);
  }
  return [...candidates.values()];
};

const mealName = (candidate: MealCandidate, foods: Food[]): string => {
  const dynamicTemplates = new Set(["pasta", "rice-bowl", "stir-fry", "oven-tray-meal", "wrap", "potato-plate"]);
  if (!dynamicTemplates.has(candidate.template.id)) return candidate.template.name;
  const lead = candidate.items
    .map((item) => foods.find((food) => food.id === item.foodId))
    .find((food) => food?.category === "protein");
  return lead ? `${lead.name} ${candidate.template.name}` : candidate.template.name;
};

export const generateMeal = ({
  foods,
  constraints,
  target,
  templates = recipeTemplates,
  lockedItems = [],
  recentFoodIds = [],
  recentRecipeTemplateIds = [],
  candidateCount = 36,
  random = Math.random,
}: GenerateMealInput): MealGenerationResult => {
  const attempts = Math.max(20, Math.min(50, Math.round(candidateCount)));
  const pool = buildCandidatePool(foods, constraints);
  const requiredIds = [...new Set([
    ...constraints.lockedFoodIds,
    ...lockedItems.map((item) => item.foodId),
    ...constraints.includedFoodIds,
  ])];
  const requiredFoods = requiredIds.flatMap((id) => {
    const food = pool.find((candidate) => candidate.id === id);
    return food ? [food] : [];
  });

  if (requiredFoods.length !== requiredIds.length) {
    return {
      ok: false,
      reason: "no_valid_combination",
      message: constraints.lockedFoodIds.length || lockedItems.length
        ? "No valid combination found with the current locked foods."
        : "An included food is not available under the current meal settings.",
    };
  }

  if (pool.length < 2) {
    return {
      ok: false,
      reason: "insufficient_foods",
      message: "Add a few more foods to your library to create a balanced meal.",
    };
  }

  const availableTemplates = filterTemplates(templates, constraints);
  const candidates = generateCandidates(
    availableTemplates,
    pool,
    requiredFoods,
    lockedItems,
    attempts,
    random,
  );
  if (candidates.length === 0) {
    return {
      ok: false,
      reason: "no_valid_combination",
      message: requiredIds.length
        ? "No valid combination found with the current locked foods."
        : "No meal combination matches the current time, equipment and food settings.",
    };
  }

  const scored = scoreCandidates(candidates, {
    foods: pool,
    constraints,
    target,
    recentFoodIds,
    recentRecipeTemplateIds,
  });
  const selected = weightedRandomSelect(scored, random)!;
  return {
    ok: true,
    candidateCount: scored.length,
    meal: {
      id: `meal-${createId()}`,
      type: constraints.mealType,
      name: mealName(selected, pool),
      items: selected.items,
      recipeTemplateId: selected.template.id,
      nutrition: selected.nutrition,
      cookingTime: selected.template.cookingTime,
      equipment: [...selected.template.equipment],
    },
  };
};
