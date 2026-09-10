import { recipeTemplates } from "../data/recipeTemplates";
import type {
  Food,
  GeneratedRecipe,
  GeneratedRecipeIngredient,
  MealItem,
  MealPlan,
  RecipeIngredientSnapshot,
  RecipeSlot,
  RecipeTemplate,
  SavedRecipe,
} from "../types";
import { createId } from "../utils/id";
import { foodMatchesSlot } from "./mealGenerator";
import { isFibreDataComplete, resolveMealPortions } from "./planNutrition";

interface ResolvedMealItem {
  item: MealItem;
  food: Food;
  itemIndex: number;
}

export interface MealItemSlotAssignment extends ResolvedMealItem {
  slot?: RecipeSlot;
}

const readableFoodName = (name: string): string => name
  .split(",")[0]
  .replace(/\bchicken breast\b/gi, "Chicken")
  .replace(/\btuna in spring water\b/gi, "Tuna")
  .replace(/\bfillets?\b/gi, "")
  .replace(/\s+/g, " ")
  .trim();

const instructionFoodName = (name: string): string =>
  readableFoodName(name).toLocaleLowerCase("en-GB");

const joinNames = (names: string[]): string => {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

export const findRecipeTemplate = (
  recipeTemplateId: string,
  templates: RecipeTemplate[] = recipeTemplates,
): RecipeTemplate | undefined => templates.find((template) => template.id === recipeTemplateId);

export const mapMealItemsToSlots = (
  meal: MealPlan,
  foods: Food[],
  template: RecipeTemplate,
): MealItemSlotAssignment[] => {
  const resolved = meal.items.flatMap((item, itemIndex): ResolvedMealItem[] => {
    const food = foods.find((candidate) => candidate.id === item.foodId);
    return food ? [{ item, food, itemIndex }] : [];
  });
  const ordered = [...resolved].sort((a, b) => {
    const aOptions = template.slots.filter((slot) => foodMatchesSlot(a.food, slot)).length;
    const bOptions = template.slots.filter((slot) => foodMatchesSlot(b.food, slot)).length;
    return aOptions - bOptions || a.itemIndex - b.itemIndex;
  });
  const slotCounts = new Map<string, number>();
  const slotByItemIndex = new Map<number, RecipeSlot>();

  const assign = (index: number): boolean => {
    if (index >= ordered.length) return true;
    const entry = ordered[index];
    for (const slot of template.slots) {
      const count = slotCounts.get(slot.id) ?? 0;
      if (count >= slot.maxItems || !foodMatchesSlot(entry.food, slot)) continue;
      slotCounts.set(slot.id, count + 1);
      slotByItemIndex.set(entry.itemIndex, slot);
      if (assign(index + 1)) return true;
      slotByItemIndex.delete(entry.itemIndex);
      slotCounts.set(slot.id, count);
    }
    return false;
  };

  assign(0);
  return resolved
    .sort((a, b) => a.itemIndex - b.itemIndex)
    .map((entry) => ({ ...entry, slot: slotByItemIndex.get(entry.itemIndex) }));
};

const foodsBySlot = (
  assignments: MealItemSlotAssignment[],
): Map<string, Food[]> => {
  const result = new Map<string, Food[]>();
  for (const assignment of assignments) {
    if (!assignment.slot) continue;
    result.set(assignment.slot.id, [
      ...(result.get(assignment.slot.id) ?? []),
      assignment.food,
    ]);
  }
  return result;
};

export const buildGeneratedRecipeName = (
  template: RecipeTemplate,
  assignments: MealItemSlotAssignment[],
): string => {
  const bySlot = foodsBySlot(assignments);
  const selectedNames: string[] = [];

  for (const slotId of template.nameRule.ingredientSlotIds) {
    for (const food of bySlot.get(slotId) ?? []) {
      const name = readableFoodName(food.name);
      if (name && !selectedNames.includes(name)) selectedNames.push(name);
      if (selectedNames.length >= template.nameRule.maxIngredients) break;
    }
    if (selectedNames.length >= template.nameRule.maxIngredients) break;
  }

  if (selectedNames.length === 0) return template.name;
  const ingredients = selectedNames.join(" & ");
  return template.nameRule.suffix
    ? `${ingredients} ${template.nameRule.suffix}`
    : ingredients;
};

export const buildRecipeInstructions = (
  template: RecipeTemplate,
  assignments: MealItemSlotAssignment[],
): string[] => {
  const bySlot = foodsBySlot(assignments);
  return template.instructionSteps.flatMap((step) => {
    if (step.whenSlotsPresent?.some((slotId) => !(bySlot.get(slotId)?.length))) return [];
    const placeholders = [...step.text.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    if (placeholders.some((slotId) => !(bySlot.get(slotId)?.length))) return [];
    const text = step.text.replace(/\{([^}]+)\}/g, (_match, slotId: string) =>
      joinNames((bySlot.get(slotId) ?? []).map((food) => instructionFoodName(food.name))));
    return [text];
  });
};

export const deriveGeneratedRecipe = (
  meal: MealPlan,
  foods: Food[],
  templates: RecipeTemplate[] = recipeTemplates,
): GeneratedRecipe => {
  const template = findRecipeTemplate(meal.recipeTemplateId, templates);
  const assignments = template ? mapMealItemsToSlots(meal, foods, template) : [];
  const assignmentByFoodId = new Map(assignments.map((assignment) => [
    assignment.item.foodId,
    assignment,
  ]));
  const ingredients = meal.items.flatMap((item): GeneratedRecipeIngredient[] => {
    const food = foods.find((candidate) => candidate.id === item.foodId);
    if (!food) return [];
    return [{
      foodId: food.id,
      foodName: food.name,
      amount: item.amount,
      unit: item.unit,
      category: food.category,
      inStock: food.inStock,
      locked: item.locked,
      slotId: assignmentByFoodId.get(item.foodId)?.slot?.id,
    }];
  });

  return {
    name: template ? buildGeneratedRecipeName(template, assignments) : meal.name,
    sourceTemplateId: meal.recipeTemplateId,
    mealType: meal.type,
    ingredients,
    cookingTime: meal.cookingTime,
    equipment: [...meal.equipment],
    instructions: template
      ? buildRecipeInstructions(template, assignments)
      : ["Prepare the listed ingredients as needed.", "Combine and serve."],
    nutrition: meal.nutrition,
    fibreDataComplete: isFibreDataComplete(resolveMealPortions(meal.items, foods)),
  };
};

type RecipeSnapshotShape = {
  sourceTemplateId: string;
  mealType: string;
  ingredients: RecipeIngredientSnapshot[];
};

export const recipeSnapshotKey = (recipe: RecipeSnapshotShape): string => [
  recipe.sourceTemplateId,
  recipe.mealType,
  ...recipe.ingredients.map((ingredient) => [
    ingredient.foodId,
    ingredient.amount,
    ingredient.unit,
  ].join(":")),
].join("|");

export const createSavedRecipeSnapshot = (
  recipe: GeneratedRecipe,
  options: { id?: string; createdAt?: string } = {},
): SavedRecipe => ({
  id: options.id ?? `recipe-${createId()}`,
  name: recipe.name,
  sourceTemplateId: recipe.sourceTemplateId,
  mealType: recipe.mealType,
  ingredients: recipe.ingredients.map(({ foodId, foodName, amount, unit }) => ({
    foodId,
    foodName,
    amount,
    unit,
  })),
  cookingTime: recipe.cookingTime,
  equipment: [...recipe.equipment],
  instructions: [...recipe.instructions],
  nutrition: { ...recipe.nutrition },
  fibreDataComplete: recipe.fibreDataComplete,
  createdAt: options.createdAt ?? new Date().toISOString(),
});
