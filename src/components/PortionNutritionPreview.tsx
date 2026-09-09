import { calculateFoodNutrition } from "../engine/nutritionCalculator";
import type { Food, ServingUnit } from "../types";

interface PortionNutritionPreviewProps {
  food: Food;
  amount: number;
  unit: ServingUnit;
}

const basisLabels = {
  per_100g: "per 100g",
  per_100ml: "per 100ml",
  per_unit: "per unit",
};

export function PortionNutritionPreview({ food, amount, unit }: PortionNutritionPreviewProps) {
  let nutrition;
  try {
    nutrition = calculateFoodNutrition({ food, amount, unit });
  } catch {
    return (
      <aside className="nutrition-preview nutrition-preview--empty">
        Add a valid serving and unit conversion to see the nutrition preview.
      </aside>
    );
  }

  return (
    <aside className="nutrition-preview" aria-live="polite">
      <div className="nutrition-preview__heading">
        <div>
          <span className="section-kicker">Portion preview</span>
          <strong>{food.name || "New food"}</strong>
        </div>
        <span>{amount || 0} {unit}</span>
      </div>
      <p className="preview-basis">Nutrition basis: {basisLabels[food.nutritionBasis]}</p>
      <div className="nutrition-grid">
        <div><strong>{nutrition.calories}</strong><span>kcal</span></div>
        <div><strong>{nutrition.protein}g</strong><span>protein</span></div>
        <div><strong>{nutrition.carbs}g</strong><span>carbs</span></div>
        <div><strong>{nutrition.fat}g</strong><span>fat</span></div>
        <div><strong>{nutrition.fibre === undefined ? "—" : `${nutrition.fibre}g`}</strong><span>fibre</span></div>
      </div>
    </aside>
  );
}
