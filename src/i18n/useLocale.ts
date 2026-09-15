import { useCallback } from "react";
import { useAppStore } from "../stores/useAppStore";
import {
  categoryLabel,
  equipmentLabel,
  formatList,
  foodTagLabel,
  getFoodDisplayName,
  getReferenceDisplayName,
  ingredientKindLabel,
  mealTypeLabel,
  translate,
} from "./locale";
import type { TranslationKey } from "./translations";

export function useLocale() {
  const locale = useAppStore((state) => state.locale);
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  return {
    locale,
    t,
    list: useCallback((values: string[]) => formatList(values, locale), [locale]),
    foodName: useCallback((food: Parameters<typeof getFoodDisplayName>[0]) => getFoodDisplayName(food, locale), [locale]),
    referenceFoodName: useCallback((food: Parameters<typeof getReferenceDisplayName>[0]) => getReferenceDisplayName(food, locale), [locale]),
    categoryName: useCallback((category: Parameters<typeof categoryLabel>[0]) => categoryLabel(category, locale), [locale]),
    mealName: useCallback((mealType: Parameters<typeof mealTypeLabel>[0], short = false) => mealTypeLabel(mealType, locale, short), [locale]),
    equipmentName: useCallback((equipment: Parameters<typeof equipmentLabel>[0]) => equipmentLabel(equipment, locale), [locale]),
    tagName: useCallback((tag: Parameters<typeof foodTagLabel>[0]) => foodTagLabel(tag, locale), [locale]),
    ingredientKindName: useCallback((kind: Parameters<typeof ingredientKindLabel>[0]) => ingredientKindLabel(kind, locale), [locale]),
  };
}
