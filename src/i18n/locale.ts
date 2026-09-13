import type { Equipment, Food, FoodCategory, FoodTag, MealType, ReferenceFood } from "../types";
import { referenceFoodNamesZh } from "./foodNames";
import { translations, type Locale, type TranslationKey } from "./translations";

export { type Locale, type TranslationKey } from "./translations";

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const isLocale = (value: unknown): value is Locale =>
  value === "en" || value === "zh-CN";

export const translate = (
  locale: Locale,
  key: TranslationKey,
  params: Record<string, string | number> = {},
): string => Object.entries(params).reduce(
  (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
  translations[locale][key] as string,
);

export const formatNumber = (value: number, locale: Locale): string =>
  new Intl.NumberFormat(locale === "zh-CN" ? "zh-CN" : "en-GB").format(value);

export const formatList = (values: string[], locale: Locale): string =>
  new Intl.ListFormat(locale === "zh-CN" ? "zh-CN" : "en-GB", {
    style: "short",
    type: "conjunction",
  }).format(values);

export const formatTodayDate = (dateKey: string | undefined, locale: Locale): string => {
  const date = dateKey ? new Date(`${dateKey}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
};

export const getReferenceFoodDisplayName = (
  referenceFoodId: string | undefined,
  fallback: string,
  locale: Locale,
): string => locale === "zh-CN" && referenceFoodId
  ? referenceFoodNamesZh[referenceFoodId as keyof typeof referenceFoodNamesZh] ?? fallback
  : fallback;

export const getFoodDisplayName = (
  food: Pick<Food, "id" | "referenceFoodId" | "name" | "nutritionSource">,
  locale: Locale,
): string => {
  if (locale !== "zh-CN") return food.name;
  const referenceFoodId = food.referenceFoodId
    ?? (food.nutritionSource === "reference" ? food.id : undefined);
  return getReferenceFoodDisplayName(referenceFoodId, food.name, locale);
};

export const getReferenceDisplayName = (food: ReferenceFood, locale: Locale): string =>
  getReferenceFoodDisplayName(food.id, food.name, locale);

export const categoryLabel = (category: FoodCategory, locale: Locale): string =>
  translate(locale, `category.${category}` as TranslationKey);

export const mealTypeLabel = (mealType: MealType, locale: Locale, short = false): string =>
  translate(locale, mealType === "snack" && short ? "meal.snackShort" : `meal.${mealType}` as TranslationKey);

export const equipmentLabel = (equipment: Equipment, locale: Locale): string =>
  translate(locale, `equipment.${equipment}` as TranslationKey);

export const foodTagLabel = (tag: FoodTag, locale: Locale): string =>
  translate(locale, `tag.${tag}` as TranslationKey);

const generationMessageKeys: Record<string, TranslationKey> = {
  "No valid combination found with the current locked foods.": "generation.locked",
  "An included food is not available under the current meal settings.": "generation.includedUnavailable",
  "Add a few more foods to your library to create a balanced meal.": "generation.insufficient",
  "No meal combination matches the current time, equipment and food settings.": "generation.noMatch",
  "There aren’t enough suitable in-stock foods for this meal. Add a few foods or switch to Plan Freely.": "generation.insufficientInventory",
  "There aren’t enough suitable foods for this meal. Add a few foods to My Foods.": "generation.insufficientFoods",
  "This is the only suitable meal for the current settings.": "generation.onlyCandidate",
};

export const localizeGenerationMessage = (message: string, locale: Locale): string => {
  const key = generationMessageKeys[message];
  return key ? translate(locale, key) : message;
};
