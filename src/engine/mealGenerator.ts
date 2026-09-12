import { recipeTemplates } from "../data/recipeTemplates";
import { relaxedMealBlueprints } from "../data/relaxedMealBlueprints";
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
import { getCompatibleTechniques, selectDefaultTechnique } from "./cookingTechnique";

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
  template.mealTypes.includes(constraints.mealType),
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
  constraints: GeneratorConstraints,
  random: () => number,
): MealCandidate[] => {
  const selectedFoods = fillTemplateSlots(template, pool, requiredFoods, random);
  if (!selectedFoods) return [];
  const lockedById = new Map(lockedItems.map((item) => [item.foodId, item]));
  const items = selectedFoods.map((food): MealItem => {
    const lockedItem = lockedById.get(food.id);
    return lockedItem
      ? { ...lockedItem, locked: true }
      : { foodId: food.id, amount: food.defaultServing, unit: food.servingUnit, locked: false };
  });
  const techniques = getCompatibleTechniques({
    blueprint: template,
    mealType: constraints.mealType,
    foods: selectedFoods,
    allowedEquipment: constraints.allowedEquipment,
    maxCookingTime: constraints.maxCookingTime,
  });
  const preferred = selectDefaultTechnique(techniques, template.id);
  const orderedTechniques = preferred
    ? [preferred, ...techniques.filter((technique) => technique.id !== preferred.id)]
    : techniques;
  const calculated = calculateCandidateNutrition(items, pool);
  return orderedTechniques.map((technique) => ({
    template,
    technique,
    items,
    ...calculated,
    score: 0,
  }));
};

export const generateCandidates = (
  templates: RecipeTemplate[],
  pool: Food[],
  requiredFoods: Food[],
  lockedItems: MealItem[],
  constraints: GeneratorConstraints,
  attempts: number,
  random: () => number,
): MealCandidate[] => {
  if (templates.length === 0) return [];
  const candidates = new Map<string, MealCandidate>();
  const startIndex = templates.length ? randomIndex(templates.length, random) : 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const template = templates[(startIndex + attempt) % templates.length];
    const variants = buildCandidate(template, pool, requiredFoods, lockedItems, constraints, random);
    for (const candidate of variants) {
      const key = `${template.id}:${candidate.technique.id}:${candidate.items.map((item) => item.foodId).sort().join(",")}`;
      candidates.set(key, candidate);
    }
  }
  return [...candidates.values()];
};

const relaxedCompositionIsMeaningful = (foods: Food[], mealType: GeneratorConstraints["mealType"]): boolean => {
  const categories = new Set(foods.map((food) => food.category));
  if (mealType === "lunch") {
    return foods.length >= 2 && (
      (categories.has("protein") && categories.has("carb"))
      || (categories.has("protein") && categories.has("vegetable"))
      || (foods.length >= 3 && categories.has("carb") && categories.has("vegetable"))
    );
  }
  if (mealType === "breakfast") {
    if (foods.length === 1) return categories.has("protein") || categories.has("carb") || categories.has("fruit") || categories.has("composite");
    return categories.has("protein") || categories.has("carb") || categories.has("fruit");
  }
  if (foods.length === 1) return categories.has("fruit") || categories.has("protein") || categories.has("composite");
  return categories.has("fruit") && categories.has("protein");
};

const combinations = <T>(values: T[], count: number, limit = 120): T[][] => {
  const result: T[][] = [];
  const visit = (start: number, selected: T[]) => {
    if (result.length >= limit) return;
    if (selected.length === count) {
      result.push(selected);
      return;
    }
    for (let index = start; index < values.length; index += 1) {
      visit(index + 1, [...selected, values[index]]);
      if (result.length >= limit) return;
    }
  };
  visit(0, []);
  return result;
};

export const generateRelaxedCandidates = (
  pool: Food[],
  requiredFoods: Food[],
  lockedItems: MealItem[],
  constraints: GeneratorConstraints,
): MealCandidate[] => {
  const blueprint = relaxedMealBlueprints.find((candidate) => candidate.mealTypes.includes(constraints.mealType));
  if (!blueprint) return [];
  const maximumItems = constraints.mealType === "lunch" ? 4 : constraints.mealType === "breakfast" ? 3 : 2;
  const minimumItems = constraints.mealType === "lunch" ? 2 : 1;
  if (requiredFoods.length > maximumItems) return [];
  const requiredIds = new Set(requiredFoods.map((food) => food.id));
  const choices = pool.filter((food) => !requiredIds.has(food.id));
  const lockedById = new Map(lockedItems.map((item) => [item.foodId, item]));
  const result = new Map<string, MealCandidate>();

  for (let size = Math.max(minimumItems, requiredFoods.length); size <= maximumItems; size += 1) {
    for (const extras of combinations(choices, size - requiredFoods.length)) {
      const selectedFoods = [...requiredFoods, ...extras];
      if (!relaxedCompositionIsMeaningful(selectedFoods, constraints.mealType)) continue;
      const techniques = getCompatibleTechniques({
        blueprint,
        mealType: constraints.mealType,
        foods: selectedFoods,
        allowedEquipment: constraints.allowedEquipment,
        maxCookingTime: constraints.maxCookingTime,
      });
      if (techniques.length === 0) continue;
      const items = selectedFoods.map((food): MealItem => {
        const locked = lockedById.get(food.id);
        return locked
          ? { ...locked, locked: true }
          : { foodId: food.id, amount: food.defaultServing, unit: food.servingUnit, locked: false };
      });
      const calculated = calculateCandidateNutrition(items, pool);
      for (const technique of techniques) {
        const candidate: MealCandidate = { template: blueprint, technique, items, ...calculated, score: 0 };
        const key = `${technique.id}:${items.map((item) => item.foodId).sort().join(",")}`;
        result.set(key, candidate);
      }
    }
  }
  return [...result.values()];
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

  const availableTemplates = filterTemplates(templates, constraints);
  const standardCandidates = generateCandidates(
    availableTemplates,
    pool,
    requiredFoods,
    lockedItems,
    constraints,
    attempts,
    random,
  );
  const candidates = standardCandidates.length > 0
    ? standardCandidates
    : generateRelaxedCandidates(pool, requiredFoods, lockedItems, constraints);
  if (candidates.length === 0) {
    const minimumFoodCount = constraints.mealType === "lunch" ? 2 : 1;
    return {
      ok: false,
      reason: pool.length < minimumFoodCount ? "insufficient_foods" : "no_valid_combination",
      message: requiredIds.length
        ? "No valid combination found with the current locked foods."
        : constraints.inventoryOnly
          ? "There aren’t enough suitable in-stock foods for this meal. Add a few foods or switch to Plan Freely."
          : "There aren’t enough suitable foods for this meal. Add a few foods to My Foods.",
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
      techniqueId: selected.technique.id,
      nutrition: selected.nutrition,
      cookingTime: selected.technique.cookingTime,
      equipment: [...selected.technique.requiredEquipment],
    },
  };
};
