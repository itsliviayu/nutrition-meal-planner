import type { Food } from "../types";
import { categoryLabel } from "../utils/foodOptions";
import { Icon } from "./Icon";

interface FoodCardProps {
  food: Food;
  onEdit: () => void;
  onToggleInStock: () => void;
  onToggleFavourite: () => void;
  onToggleRegularBuy: () => void;
}

const basisLabel = {
  per_100g: "100g",
  per_100ml: "100ml",
  per_unit: "unit",
};

const sourceLabel = {
  reference: "Reference nutrition",
  package_label: "Package label",
  manual_estimate: "Manual estimate",
};

export function FoodCard({ food, onEdit, onToggleInStock, onToggleFavourite, onToggleRegularBuy }: FoodCardProps) {
  return (
    <article className="food-card">
      <div className="food-card__head">
        <div>
          <span className={`category-dot category-dot--${food.category}`} />
          <span className="food-card__category">{categoryLabel(food.category)}</span>
          <h2>{food.name}</h2>
          <p className="food-card__meta">{[food.brand, food.store, sourceLabel[food.nutritionSource]].filter(Boolean).join(" · ")}</p>
        </div>
        <button className="icon-button icon-button--small" type="button" onClick={onEdit} aria-label={`Edit ${food.name}`}>
          <Icon name="edit" size={18} />
        </button>
      </div>

      <div className="food-card__nutrition">
        <div><strong>{food.nutritionSource === "package_label" ? "" : "≈"}{food.nutrition.calories}</strong><span>kcal / {basisLabel[food.nutritionBasis]}</span></div>
        <div><strong>{food.nutrition.protein}g</strong><span>protein</span></div>
        <div><strong>{food.defaultServing}{food.servingUnit === "piece" ? " pc" : food.servingUnit}</strong><span>usual serving</span></div>
      </div>

      <div className="food-card__actions" aria-label={`${food.name} status`}>
        <button type="button" className={food.inStock ? "status-chip is-active" : "status-chip"} aria-pressed={food.inStock} onClick={onToggleInStock}>
          <span aria-hidden="true">{food.inStock ? "✓" : "+"}</span> In stock
        </button>
        <button type="button" className={food.favourite ? "status-chip is-active" : "status-chip"} aria-pressed={food.favourite} onClick={onToggleFavourite}>
          <span aria-hidden="true">{food.favourite ? "♥" : "♡"}</span> Favourite
        </button>
        <button type="button" className={food.regularBuy ? "status-chip is-active" : "status-chip"} aria-pressed={food.regularBuy} onClick={onToggleRegularBuy}>
          <span aria-hidden="true">{food.regularBuy ? "↻" : "+"}</span> Regular
        </button>
      </div>
    </article>
  );
}
