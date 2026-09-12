import { recipeTemplates } from "../data/recipeTemplates";
import { relaxedMealBlueprints } from "../data/relaxedMealBlueprints";
import { referenceFoods } from "../data/seedFoods";
import { getFoodDisplayName, type Locale } from "../i18n/locale";
import { recipeTemplateZh } from "../i18n/recipeLocalizations";
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
import { buildTechniqueRecipe, getCompatibleTechniques, selectDefaultTechnique } from "./cookingTechnique";
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

const readableChineseFoodName = (food: Food): string => getFoodDisplayName(food, "zh-CN")
  .replace("鸡胸肉", "鸡肉")
  .replace("三文鱼柳", "三文鱼")
  .replace("鳕鱼柳", "鳕鱼")
  .replace("大虾仁", "虾仁");

const displayFoodName = (food: Food, locale: Locale): string => locale === "zh-CN"
  ? readableChineseFoodName(food)
  : readableFoodName(food.name);

const instructionFoodName = (food: Food, locale: Locale): string => locale === "zh-CN"
  ? getFoodDisplayName(food, locale)
  : readableFoodName(food.name).toLocaleLowerCase("en-GB");

const joinNames = (names: string[], locale: Locale): string => {
  if (names.length <= 1) return names[0] ?? "";
  if (locale === "zh-CN") return names.join("和");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

export const findRecipeTemplate = (
  recipeTemplateId: string,
  templates: RecipeTemplate[] = [...recipeTemplates, ...relaxedMealBlueprints],
): RecipeTemplate | undefined => templates.find((template) => template.id === recipeTemplateId);

export const getMealCompatibleTechniques = (
  meal: MealPlan,
  foods: Food[],
  templates?: RecipeTemplate[],
) => {
  const blueprint = findRecipeTemplate(meal.recipeTemplateId, templates);
  if (!blueprint) return [];
  const mealFoods = meal.items.flatMap((item) => {
    const food = foods.find((candidate) => candidate.id === item.foodId);
    return food ? [food] : [];
  });
  return getCompatibleTechniques({ blueprint, mealType: meal.type, foods: mealFoods });
};

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
  locale: Locale = "en",
): string => {
  const bySlot = foodsBySlot(assignments);
  const selectedNames: string[] = [];
  const localization = locale === "zh-CN" ? recipeTemplateZh[template.id] : undefined;
  const ingredientSlotIds = localization?.ingredientSlotIds ?? template.nameRule.ingredientSlotIds;

  for (const slotId of ingredientSlotIds) {
    for (const food of bySlot.get(slotId) ?? []) {
      const name = displayFoodName(food, locale);
      if (name && !selectedNames.includes(name)) selectedNames.push(name);
      if (selectedNames.length >= template.nameRule.maxIngredients) break;
    }
    if (selectedNames.length >= template.nameRule.maxIngredients) break;
  }

  if (selectedNames.length === 0) return localization?.name ?? template.name;
  const ingredients = locale === "zh-CN" ? selectedNames.join("") : selectedNames.join(" & ");
  const suffix = localization?.suffix ?? template.nameRule.suffix;
  return suffix
    ? locale === "zh-CN" ? `${ingredients}${suffix}` : `${ingredients} ${suffix}`
    : ingredients;
};

export const buildRecipeInstructions = (
  template: RecipeTemplate,
  assignments: MealItemSlotAssignment[],
  locale: Locale = "en",
): string[] => {
  const bySlot = foodsBySlot(assignments);
  const steps = locale === "zh-CN"
    ? recipeTemplateZh[template.id]?.instructions ?? template.instructionSteps
    : template.instructionSteps;
  return steps.flatMap((step) => {
    if (step.whenSlotsPresent?.some((slotId) => !(bySlot.get(slotId)?.length))) return [];
    const placeholders = [...step.text.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    if (placeholders.some((slotId) => !(bySlot.get(slotId)?.length))) return [];
    const text = step.text.replace(/\{([^}]+)\}/g, (_match, slotId: string) =>
      joinNames((bySlot.get(slotId) ?? []).map((food) => instructionFoodName(food, locale)), locale));
    return [text];
  });
};

export const deriveGeneratedRecipe = (
  meal: MealPlan,
  foods: Food[],
  templates: RecipeTemplate[] = [...recipeTemplates, ...relaxedMealBlueprints],
  locale: Locale = "en",
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
      referenceFoodId: food.referenceFoodId,
      foodName: getFoodDisplayName(food, locale),
      amount: item.amount,
      unit: item.unit,
      category: food.category,
      inStock: food.inStock,
      locked: item.locked,
      slotId: assignmentByFoodId.get(item.foodId)?.slot?.id,
    }];
  });
  const mealFoods = meal.items.flatMap((item) => {
    const food = foods.find((candidate) => candidate.id === item.foodId);
    return food ? [food] : [];
  });
  const compatibleTechniques = template
    ? getCompatibleTechniques({ blueprint: template, mealType: meal.type, foods: mealFoods })
    : [];
  const technique = compatibleTechniques.find((candidate) => candidate.id === meal.techniqueId)
    ?? (template ? selectDefaultTechnique(compatibleTechniques, template.id) : undefined);
  const variant = technique ? buildTechniqueRecipe(technique, mealFoods, locale) : undefined;

  return {
    name: variant?.name ?? (template ? buildGeneratedRecipeName(template, assignments, locale) : meal.name),
    sourceTemplateId: meal.recipeTemplateId,
    techniqueId: technique?.id,
    mealType: meal.type,
    ingredients,
    cookingTime: technique?.cookingTime ?? meal.cookingTime,
    equipment: [...(technique?.requiredEquipment ?? meal.equipment)],
    instructions: variant?.instructions ?? (template
      ? buildRecipeInstructions(template, assignments, locale)
      : locale === "zh-CN"
        ? ["根据需要处理好列出的食材。", "组合装盘后即可食用。"]
        : ["Prepare the listed ingredients as needed.", "Combine and serve."]),
    nutrition: meal.nutrition,
    fibreDataComplete: isFibreDataComplete(resolveMealPortions(meal.items, foods)),
  };
};

export interface SavedRecipeDisplay {
  name: string;
  instructions: string[];
}

export const deriveSavedRecipeDisplay = (
  recipe: SavedRecipe,
  foods: Food[],
  locale: Locale,
): SavedRecipeDisplay => {
  if (!recipe.techniqueId) return { name: recipe.name, instructions: recipe.instructions };
  const template = findRecipeTemplate(recipe.sourceTemplateId);
  if (!template) return { name: recipe.name, instructions: recipe.instructions };
  const resolvedFoods = recipe.ingredients.map((ingredient) => foods.find((food) => food.id === ingredient.foodId)
    ?? (ingredient.referenceFoodId
      ? foods.find((food) => food.referenceFoodId === ingredient.referenceFoodId)
        ?? referenceFoods.find((food) => food.id === ingredient.referenceFoodId)
      : undefined));
  if (resolvedFoods.some((food) => !food)) return { name: recipe.name, instructions: recipe.instructions };
  const displayMeal: MealPlan = {
    id: recipe.id,
    type: recipe.mealType,
    name: recipe.name,
    items: recipe.ingredients.map((ingredient) => ({
      foodId: ingredient.foodId,
      amount: ingredient.amount,
      unit: ingredient.unit,
      locked: false,
    })),
    recipeTemplateId: recipe.sourceTemplateId,
    techniqueId: recipe.techniqueId,
    nutrition: recipe.nutrition,
    cookingTime: recipe.cookingTime,
    equipment: recipe.equipment,
  };
  const displayFoods = resolvedFoods.map((food, index) => ({
    ...food!,
    id: recipe.ingredients[index].foodId,
  }));
  const assignments = mapMealItemsToSlots(displayMeal, displayFoods, template);
  const technique = getMealCompatibleTechniques(displayMeal, displayFoods)
    .find((candidate) => candidate.id === recipe.techniqueId);
  if (technique) return buildTechniqueRecipe(technique, displayFoods, locale);
  return {
    name: buildGeneratedRecipeName(template, assignments, locale),
    instructions: buildRecipeInstructions(template, assignments, locale),
  };
};

type RecipeSnapshotShape = {
  sourceTemplateId: string;
  techniqueId?: string;
  mealType: string;
  ingredients: RecipeIngredientSnapshot[];
};

export const recipeSnapshotKey = (recipe: RecipeSnapshotShape): string => [
  recipe.sourceTemplateId,
  recipe.techniqueId ?? "legacy",
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
  techniqueId: recipe.techniqueId,
  mealType: recipe.mealType,
  ingredients: recipe.ingredients.map(({ foodId, referenceFoodId, foodName, amount, unit }) => ({
    foodId,
    referenceFoodId,
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
