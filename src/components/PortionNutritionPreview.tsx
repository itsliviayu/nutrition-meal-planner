import { calculateFoodNutrition } from "../engine/nutritionCalculator";
import { useLocale } from "../i18n/useLocale";
import type { Food, ServingUnit } from "../types";

interface PortionNutritionPreviewProps {
  food: Food;
  amount: number;
  unit: ServingUnit;
}

export function PortionNutritionPreview({ food, amount, unit }: PortionNutritionPreviewProps) {
  const { foodName, t } = useLocale();
  let nutrition;
  try {
    nutrition = calculateFoodNutrition({ food, amount, unit });
  } catch {
    return (
      <aside className="nutrition-preview nutrition-preview--empty">
        {t("preview.invalid")}
      </aside>
    );
  }

  return (
    <aside className="nutrition-preview" aria-live="polite">
      <div className="nutrition-preview__heading">
        <div>
          <span className="section-kicker">{t("preview.title")}</span>
          <strong>{food.name ? foodName(food) : t("preview.newFood")}</strong>
        </div>
        <span>{amount || 0} {unit === "piece" ? t("common.pieceShort") : unit}</span>
      </div>
      <p className="preview-basis">{t("preview.basis", {
        basis: t(food.nutritionBasis === "per_100g" ? "form.per100g" : food.nutritionBasis === "per_100ml" ? "form.per100ml" : "form.perUnit"),
      })}</p>
      <div className="nutrition-grid">
        <div><strong>{nutrition.calories}</strong><span>kcal</span></div>
        <div><strong>{nutrition.protein}g</strong><span>{t("nutrition.protein")}</span></div>
        <div><strong>{nutrition.carbs}g</strong><span>{t("nutrition.carbs")}</span></div>
        <div><strong>{nutrition.fat}g</strong><span>{t("nutrition.fat")}</span></div>
        <div><strong>{nutrition.fibre === undefined ? "—" : `${nutrition.fibre}g`}</strong><span>{t("nutrition.fibre")}</span></div>
      </div>
    </aside>
  );
}
