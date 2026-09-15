import { recipeTemplates } from "../data/recipeTemplates";
import type {
  BuyAgainSuggestion,
  DailyPlan,
  Food,
  GeneratedRecipe,
  MealPlan,
  MealType,
  NewFoodSuggestion,
  PlanNeededFood,
  RecipeIngredientSnapshot,
  RecipeTemplate,
  ReferenceFood,
  SavedRecipe,
  ShoppingItem,
  ShoppingItemSource,
  ShoppingNeed,
} from "../types";
import { createId } from "../utils/id";
import { foodMatchesSlot } from "./mealGenerator";

const normalizeName = (name: string): string =>
  name.trim().toLocaleLowerCase("en-GB").replaceAll(/\s+/g, " ");

export const findUniqueReferenceUserFood = (
  referenceFoodId: string | undefined,
  foods: Food[],
): Food | undefined => {
  if (!referenceFoodId) return undefined;
  const matches = foods.filter((food) => food.referenceFoodId === referenceFoodId);
  return matches.length === 1 ? matches[0] : undefined;
};

const findCurrentUserFood = (
  ingredient: RecipeIngredientSnapshot,
  foods: Food[],
): Food | undefined => foods.find((food) => food.id === ingredient.foodId)
  ?? findUniqueReferenceUserFood(ingredient.referenceFoodId, foods);

const needFromIngredient = (
  ingredient: RecipeIngredientSnapshot,
  foods: Food[],
): ShoppingNeed | undefined => {
  const currentFood = findCurrentUserFood(ingredient, foods);
  if (currentFood?.inStock) return undefined;
  if (currentFood) {
    return {
      foodId: currentFood.id,
      referenceFoodId: currentFood.referenceFoodId,
      displayName: currentFood.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      status: "missing",
    };
  }
  return {
    foodId: ingredient.foodId,
    referenceFoodId: ingredient.referenceFoodId,
    displayName: ingredient.foodName,
    amount: ingredient.amount,
    unit: ingredient.unit,
    status: "stock_status_unavailable",
  };
};

const dedupeNeeds = (needs: ShoppingNeed[]): ShoppingNeed[] => {
  const seen = new Set<string>();
  return needs.filter((need) => {
    const key = shoppingIdentityKey(need);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const shoppingIdentityKey = (
  item: Pick<ShoppingItem | ShoppingNeed, "foodId" | "referenceFoodId" | "displayName">,
): string => item.foodId
  ? `food:${item.foodId}`
  : item.referenceFoodId
    ? `reference:${item.referenceFoodId}`
    : `name:${normalizeName(item.displayName)}`;

export const resolveShoppingItemUserFood = (
  item: Pick<ShoppingItem, "foodId" | "referenceFoodId">,
  foods: Food[],
): Food | undefined => foods.find((food) => food.id === item.foodId)
  ?? findUniqueReferenceUserFood(item.referenceFoodId, foods);

export const getGeneratedRecipeNeeds = (
  recipe: GeneratedRecipe,
  foods: Food[],
): ShoppingNeed[] => dedupeNeeds(recipe.ingredients.flatMap((ingredient) => {
  const need = needFromIngredient(ingredient, foods);
  return need ? [need] : [];
}));

export const getSavedRecipeNeeds = (
  recipe: SavedRecipe,
  foods: Food[],
): ShoppingNeed[] => dedupeNeeds(recipe.ingredients.flatMap((ingredient) => {
  const need = needFromIngredient(ingredient, foods);
  return need ? [need] : [];
}));

export const getMealMissingIngredients = (
  meal: MealPlan,
  foods: Food[],
): ShoppingNeed[] => meal.items.flatMap((item) => {
  const food = foods.find((candidate) => candidate.id === item.foodId);
  if (!food || food.inStock) return [];
  return [{
    foodId: food.id,
    referenceFoodId: food.referenceFoodId,
    displayName: food.name,
    amount: item.amount,
    unit: item.unit,
    status: "missing" as const,
  }];
});

export const getPlanNeededFoods = (
  plan: DailyPlan | null,
  foods: Food[],
): PlanNeededFood[] => {
  if (!plan) return [];
  const byFoodId = new Map<string, PlanNeededFood>();
  const meals: Array<[MealType, MealPlan]> = [
    ["breakfast", plan.breakfast],
    ["lunch", plan.lunch],
    ["snack", plan.snack],
  ];

  for (const [mealType, meal] of meals) {
    for (const need of getMealMissingIngredients(meal, foods)) {
      if (!need.foodId) continue;
      const existing = byFoodId.get(need.foodId);
      if (existing) {
        if (!existing.mealTypes.includes(mealType)) existing.mealTypes.push(mealType);
        continue;
      }
      byFoodId.set(need.foodId, { ...need, foodId: need.foodId, mealTypes: [mealType] });
    }
  }

  return [...byFoodId.values()];
};

export const createShoppingItemsFromNeeds = (
  needs: ShoppingNeed[],
  source: ShoppingItemSource,
  idFactory: () => string = createId,
  createdAt: string = new Date().toISOString(),
): ShoppingItem[] => dedupeNeeds(needs).map((need) => ({
  id: `shopping-${idFactory()}`,
  foodId: need.foodId,
  referenceFoodId: need.referenceFoodId,
  displayName: need.displayName,
  sources: [source],
  createdAt,
}));

export const mergeShoppingItems = (
  current: ShoppingItem[],
  additions: ShoppingItem[],
): ShoppingItem[] => {
  const merged = current.map((item) => ({ ...item, sources: [...item.sources] }));
  for (const addition of additions) {
    const key = shoppingIdentityKey(addition);
    const existingIndex = merged.findIndex((item) => shoppingIdentityKey(item) === key);
    if (existingIndex < 0) {
      merged.push({ ...addition, sources: [...addition.sources] });
      continue;
    }
    const existing = merged[existingIndex];
    merged[existingIndex] = {
      ...existing,
      foodId: existing.foodId ?? addition.foodId,
      referenceFoodId: existing.referenceFoodId ?? addition.referenceFoodId,
      sources: [...new Set([...existing.sources, ...addition.sources])],
    };
  }
  return merged;
};

const recipeCoverageForFood = (
  food: Food,
  templates: RecipeTemplate[],
): RecipeTemplate[] => templates.filter((template) =>
  template.mealTypes.some((mealType) => food.compatibleMeals.includes(mealType))
  && template.slots.some((slot) => foodMatchesSlot(food, slot)));

export const getBuyAgainSuggestions = (
  foods: Food[],
  templates: RecipeTemplate[] = recipeTemplates,
): BuyAgainSuggestion[] => {
  const candidates = foods.filter((food) => !food.inStock);
  const coverages = new Map(candidates.map((food) => [
    food.id,
    recipeCoverageForFood(food, templates).length,
  ]));
  const maxCoverage = Math.max(1, ...coverages.values());

  return candidates
    .map((food): BuyAgainSuggestion => {
      const coverage = coverages.get(food.id) ?? 0;
      const mealTypes = [...new Set(food.compatibleMeals)];
      const score = (coverage / maxCoverage) * 40
        + (food.regularBuy ? 25 : 0)
        + (mealTypes.length / 3) * 20
        + (food.favourite ? 15 : 0);
      return {
        foodId: food.id,
        name: food.name,
        mealTypes,
        recipeCoverage: coverage,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

export const excludePlanNeededSuggestions = (
  suggestions: BuyAgainSuggestion[],
  planNeeds: PlanNeededFood[],
): BuyAgainSuggestion[] => {
  const neededFoodIds = new Set(planNeeds.map((need) => need.foodId));
  return suggestions.filter((suggestion) => !neededFoodIds.has(suggestion.foodId));
};

export interface SuggestionBatch<T> {
  items: T[];
  page: number;
  pageCount: number;
  hasAnotherSet: boolean;
}

export const getSuggestionBatch = <T>(
  suggestions: T[],
  requestedPage: number,
  pageSize = 4,
): SuggestionBatch<T> => {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(suggestions.length / safePageSize));
  const page = Math.max(0, Math.floor(requestedPage)) % pageCount;
  return {
    items: suggestions.slice(page * safePageSize, (page + 1) * safePageSize),
    page,
    pageCount,
    hasAnotherSet: suggestions.length > safePageSize,
  };
};

const tagSimilarity = (referenceFood: ReferenceFood, foods: Food[]): number => {
  const referenceTags = new Set(referenceFood.tags);
  return foods.reduce((highest, food) => {
    if (food.category !== referenceFood.category) return highest;
    const union = new Set([...referenceTags, ...food.tags]);
    if (!union.size) return highest;
    const shared = food.tags.filter((tag) => referenceTags.has(tag)).length;
    return Math.max(highest, shared / union.size);
  }, 0);
};

export const getTrySomethingNewSuggestions = (
  references: ReferenceFood[],
  foods: Food[],
  templates: RecipeTemplate[] = recipeTemplates,
  limit = 4,
): NewFoodSuggestion[] => {
  const existingReferenceIds = new Set(foods.flatMap((food) => food.referenceFoodId ? [food.referenceFoodId] : []));
  const existingNames = new Set(foods.map((food) => normalizeName(food.name)));
  const categoryCounts = new Map<string, number>();
  for (const food of foods) categoryCounts.set(food.category, (categoryCounts.get(food.category) ?? 0) + 1);
  const maxCategoryCount = Math.max(1, ...categoryCounts.values());

  return references
    .filter((reference) =>
      !existingReferenceIds.has(reference.id)
      && !existingNames.has(normalizeName(reference.name)))
    .map((reference): NewFoodSuggestion => {
      const compatibleTemplates = recipeCoverageForFood(reference, templates);
      const categoryCount = categoryCounts.get(reference.category) ?? 0;
      const categoryUtility = 1 - (categoryCount / maxCategoryCount);
      const mealTypes = [...new Set(reference.compatibleMeals)];
      const nutritionUtility = reference.tags.includes("high_protein")
        || reference.tags.includes("high_fibre")
        || reference.category === "vegetable"
        || reference.category === "fruit";
      const score = Math.min(compatibleTemplates.length / 6, 1) * 45
        + categoryUtility * 25
        + (mealTypes.length / 3) * 15
        + (nutritionUtility ? 10 : 0)
        - tagSimilarity(reference, foods) * 8;
      return {
        referenceFoodId: reference.id,
        name: reference.name,
        category: reference.category,
        mealTypes,
        compatibleTemplateNames: compatibleTemplates.map((template) => template.name),
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
};
