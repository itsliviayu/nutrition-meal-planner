import type {
  Food,
  GeneratorConstraints,
  MealCandidate,
  MealNutritionTarget,
} from "../types";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const rangeFit = (value: number, min: number, max: number): number => {
  if (value >= min && value <= max) return 1;
  const centre = Math.max(1, (min + max) / 2);
  const distance = value < min ? min - value : value - max;
  return clamp01(1 - distance / centre);
};

const nutritionFit = (
  candidate: MealCandidate,
  target: MealNutritionTarget,
): number => {
  const parts: Array<{ score: number; weight: number }> = [
    { score: rangeFit(candidate.nutrition.calories, target.calories.min, target.calories.max), weight: 0.5 },
    { score: rangeFit(candidate.nutrition.protein, target.protein.min, target.protein.max), weight: 0.4 },
  ];
  if (target.fibre && candidate.fibreDataComplete) {
    parts.push({ score: rangeFit(candidate.nutrition.fibre ?? 0, target.fibre.min, target.fibre.max), weight: 0.07 });
  }
  if (target.fruitVegPortions) {
    parts.push({
      score: rangeFit(candidate.fruitVegPortions, target.fruitVegPortions.min, target.fruitVegPortions.max),
      weight: 0.03,
    });
  }
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  return parts.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight;
};

const preferenceFit = (
  candidate: MealCandidate,
  constraints: GeneratorConstraints,
  foodsById: Map<string, Food>,
  target: MealNutritionTarget,
): number => {
  const preferences = constraints.preferences;
  if (!preferences || !Object.values(preferences).some(Boolean)) return 1;
  const scores: number[] = [];
  if (preferences.highProtein) {
    scores.push(clamp01(candidate.nutrition.protein / Math.max(1, target.protein.min)));
  }
  if (preferences.lighterMeal) {
    scores.push(clamp01(1 - candidate.nutrition.calories / Math.max(1, target.calories.max * 1.6)));
  }
  const tags = new Set([
    ...candidate.template.tags,
    ...candidate.items.flatMap((item) => foodsById.get(item.foodId)?.tags ?? []),
  ]);
  if (preferences.sweet) scores.push(tags.has("sweet") ? 1 : 0);
  if (preferences.savoury) scores.push(tags.has("savoury") ? 1 : 0);
  return scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length);
};

export interface CandidateScoringContext {
  foods: Food[];
  constraints: GeneratorConstraints;
  target: MealNutritionTarget;
  recentFoodIds: string[];
  recentRecipeTemplateIds: string[];
}

export const scoreCandidate = (
  candidate: MealCandidate,
  context: CandidateScoringContext,
): number => {
  const foodsById = new Map(context.foods.map((food) => [food.id, food]));
  const requiredItems = candidate.template.slots.reduce((sum, slot) => sum + slot.minItems, 0);
  const maximumItems = candidate.template.slots.reduce((sum, slot) => sum + slot.maxItems, 0);
  const optionalCapacity = Math.max(1, maximumItems - requiredItems);
  const usefulOptionalFill = clamp01((candidate.items.length - requiredItems) / optionalCapacity);
  const recipeCompatibility = 0.9 + usefulOptionalFill * 0.1;
  const inStockCount = candidate.items.filter((item) => foodsById.get(item.foodId)?.inStock).length;
  const inventoryUsage = inStockCount / Math.max(1, candidate.items.length);
  const recentFoods = new Set(context.recentFoodIds.slice(-12));
  const freshFoodRatio = candidate.items.filter((item) => !recentFoods.has(item.foodId)).length
    / Math.max(1, candidate.items.length);
  const templateFreshness = context.recentRecipeTemplateIds.slice(-6).includes(candidate.template.id) ? 0.35 : 1;
  const variety = freshFoodRatio * 0.7 + templateFreshness * 0.3;
  const maxTime = context.constraints.maxCookingTime ?? 30;
  const convenience = candidate.template.cookingTime === 0
    ? 1
    : clamp01(1 - candidate.template.cookingTime / Math.max(1, maxTime) * 0.45);

  return Math.round((
    nutritionFit(candidate, context.target) * 40
    + recipeCompatibility * 25
    + inventoryUsage * 15
    + preferenceFit(candidate, context.constraints, foodsById, context.target) * 10
    + variety * 5
    + convenience * 5
  ) * 10) / 10;
};

export const scoreCandidates = (
  candidates: MealCandidate[],
  context: CandidateScoringContext,
): MealCandidate[] => candidates.map((candidate) => ({
  ...candidate,
  score: scoreCandidate(candidate, context),
}));

export const weightedRandomSelect = (
  candidates: MealCandidate[],
  random: () => number = Math.random,
): MealCandidate | undefined => {
  if (candidates.length === 0) return undefined;
  const ranked = [...candidates].sort((a, b) => b.score - a.score);
  const topCandidates = ranked.slice(0, Math.max(1, Math.ceil(ranked.length * 0.25)));
  const minimumScore = Math.min(...topCandidates.map((candidate) => candidate.score));
  const weights = topCandidates.map((candidate) => Math.max(1, candidate.score - minimumScore + 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * totalWeight;
  for (let index = 0; index < topCandidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return topCandidates[index];
  }
  return topCandidates.at(-1);
};
