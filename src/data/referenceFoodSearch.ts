import type { ReferenceFood } from "../types";
import { commonReferenceFoods } from "./referenceFoods";

export const POPULAR_REFERENCE_FOOD_IDS = [
  "egg",
  "greek-yogurt",
  "chicken-breast",
  "mushroom",
  "broccoli",
  "banana",
  "white-rice",
  "pasta",
] as const;

const normalizeSearchText = (value: string): string =>
  value.trim().toLocaleLowerCase().replaceAll(/\s+/g, " ");

const popularReferenceFoods = POPULAR_REFERENCE_FOOD_IDS.map((id) => {
  const food = commonReferenceFoods.find((candidate) => candidate.id === id);
  if (!food) throw new Error(`Missing popular reference food: ${id}`);
  return food;
});

export const searchReferenceFoods = (query: string): ReferenceFood[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return popularReferenceFoods;

  return commonReferenceFoods
    .map((food) => {
      const name = normalizeSearchText(food.name);
      const aliases = food.aliases.map(normalizeSearchText);
      const rank = name.startsWith(normalizedQuery)
        ? 0
        : aliases.some((alias) => alias.startsWith(normalizedQuery))
          ? 1
          : name.includes(normalizedQuery)
            ? 2
            : aliases.some((alias) => alias.includes(normalizedQuery))
              ? 3
              : -1;
      return { food, rank };
    })
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.food.name.localeCompare(b.food.name))
    .slice(0, 12)
    .map(({ food }) => food);
};
