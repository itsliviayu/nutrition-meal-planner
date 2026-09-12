import type { Food } from "../types";
import { useLocale } from "../i18n/useLocale";
import { Icon } from "./Icon";

interface FoodCardProps {
  food: Food;
  onEdit: () => void;
  onToggleInStock: () => void;
  onToggleFavourite: () => void;
  onToggleRegularBuy: () => void;
}

export function FoodCard({ food, onEdit, onToggleInStock, onToggleFavourite, onToggleRegularBuy }: FoodCardProps) {
  const { categoryName, foodName, t } = useLocale();
  const name = foodName(food);
  const sourceLabel = {
    reference: t("common.referenceNutrition"),
    package_label: t("common.packageLabel"),
    manual_estimate: t("common.manualEstimate"),
  };
  return (
    <article className="food-card">
      <div className="food-card__head">
        <div>
          <span className={`category-dot category-dot--${food.category}`} />
          <span className="food-card__category">{categoryName(food.category)}</span>
          <h2>{name}</h2>
          <p className="food-card__meta">{[food.brand, food.store, sourceLabel[food.nutritionSource]].filter(Boolean).join(" · ")}</p>
        </div>
        <button className="icon-button icon-button--small" type="button" onClick={onEdit} aria-label={t("food.editA11y", { name })}>
          <Icon name="edit" size={18} />
        </button>
      </div>

      <div className="food-card__nutrition">
        <div><strong>{food.nutritionSource === "package_label" ? "" : "≈"}{food.nutrition.calories}</strong><span>kcal / {food.nutritionBasis === "per_unit" ? t("common.unit") : food.nutritionBasis === "per_100ml" ? "100ml" : "100g"}</span></div>
        <div><strong>{food.nutrition.protein}g</strong><span>{t("nutrition.protein")}</span></div>
        <div><strong>{food.defaultServing}{food.servingUnit === "piece" ? ` ${t("common.pieceShort")}` : food.servingUnit}</strong><span>{t("food.usualServing")}</span></div>
      </div>

      <div className="food-card__actions" aria-label={t("food.statusA11y", { name })}>
        <button type="button" className={food.inStock ? "status-chip is-active" : "status-chip"} aria-pressed={food.inStock} onClick={onToggleInStock}>
          <span aria-hidden="true">{food.inStock ? "✓" : "+"}</span> {t("food.inStock")}
        </button>
        <button type="button" className={food.favourite ? "status-chip is-active" : "status-chip"} aria-pressed={food.favourite} onClick={onToggleFavourite}>
          <span aria-hidden="true">{food.favourite ? "♥" : "♡"}</span> {t("food.favourite")}
        </button>
        <button type="button" className={food.regularBuy ? "status-chip is-active" : "status-chip"} aria-pressed={food.regularBuy} onClick={onToggleRegularBuy}>
          <span aria-hidden="true">{food.regularBuy ? "↻" : "+"}</span> {t("food.regular")}
        </button>
      </div>
    </article>
  );
}
