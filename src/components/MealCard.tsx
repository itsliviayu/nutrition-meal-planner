import { useEffect, useState } from "react";
import { deriveGeneratedRecipe } from "../engine/generatedRecipe";
import { useLocale } from "../i18n/useLocale";
import type { Food, MealPlan } from "../types";

interface MealCardProps {
  meal: MealPlan;
  foods: Food[];
  onRegenerate: () => void;
  onOpenRecipe: () => void;
  missingIngredientCount: number;
  onToggleLock: (foodId: string) => void;
  onUpdatePortion: (foodId: string, amount: number) => void;
}

function PortionInput({
  amount,
  unit,
  onChange,
  reduceLabel,
  increaseLabel,
  portionLabel,
  unitLabel,
}: {
  amount: number;
  unit: MealPlan["items"][number]["unit"];
  onChange: (amount: number) => void;
  reduceLabel: string;
  increaseLabel: string;
  portionLabel: string;
  unitLabel: string;
}) {
  const [draft, setDraft] = useState(String(amount));
  useEffect(() => setDraft(String(amount)), [amount]);
  const step = unit === "piece" ? 1 : 5;
  const commit = (value: string) => {
    setDraft(value);
    const next = Number(value);
    if (Number.isFinite(next) && next > 0) onChange(next);
  };
  return (
    <div className="portion-control">
      <button type="button" aria-label={reduceLabel} onClick={() => commit(String(Math.max(step, amount - step)))}>−</button>
      <label>
        <span className="sr-only">{portionLabel}</span>
        <input type="number" min={step} step={step} value={draft} onChange={(event) => commit(event.target.value)} />
        <small>{unitLabel}</small>
      </label>
      <button type="button" aria-label={increaseLabel} onClick={() => commit(String(amount + step))}>+</button>
    </div>
  );
}

export function MealCard({ meal, foods, onRegenerate, onOpenRecipe, missingIngredientCount, onToggleLock, onUpdatePortion }: MealCardProps) {
  const { equipmentName, foodName, locale, mealName, t } = useLocale();
  const [editingPortions, setEditingPortions] = useState(false);
  const equipment = meal.equipment.length ? meal.equipment.map(equipmentName).join(" · ") : t("equipment.none");
  const displayMealName = deriveGeneratedRecipe(meal, foods, undefined, locale).name;

  return (
    <article className="meal-card">
      <header className="meal-card__header">
        <div>
          <p className="section-kicker">{mealName(meal.type)}</p>
          <h2>{displayMealName}</h2>
          <span>{Math.round(meal.nutrition.calories)} kcal · {Math.round(meal.nutrition.protein)}g {t("nutrition.protein")}</span>
          {missingIngredientCount > 0 && (
            <button className="meal-card__missing" type="button" onClick={onOpenRecipe}>
              {t(missingIngredientCount === 1 ? "meal.toBuyOne" : "meal.toBuyMany", { count: missingIngredientCount })}
            </button>
          )}
        </div>
        <div className="meal-card__time"><strong>{meal.cookingTime}</strong><span>{t("common.minutes")}</span></div>
      </header>

      <ul className="meal-items">
        {meal.items.map((item) => {
          const food = foods.find((candidate) => candidate.id === item.foodId);
          const name = food ? foodName(food) : t("meal.unavailableFood");
          return (
            <li key={item.foodId}>
              <button
                className={item.locked ? "lock-button is-locked" : "lock-button"}
                type="button"
                aria-label={`${t(item.locked ? "meal.unlock" : "meal.lock")} ${name}`}
                aria-pressed={item.locked}
                onClick={() => onToggleLock(item.foodId)}
              >
                <span aria-hidden="true">{item.locked ? "●" : "○"}</span>
              </button>
              <div className="meal-item__name"><strong>{name}</strong><span>{t(item.locked ? "meal.lockedForRegenerate" : "meal.canBeVaried")}</span></div>
              {editingPortions ? (
                <PortionInput
                  amount={item.amount}
                  unit={item.unit}
                  reduceLabel={t("meal.reducePortion", { name })}
                  increaseLabel={t("meal.increasePortion", { name })}
                  portionLabel={t("meal.portionLabel", { name })}
                  unitLabel={item.unit === "piece" ? t("common.pieceShort") : item.unit}
                  onChange={(amount) => onUpdatePortion(item.foodId, amount)}
                />
              ) : (
                <span className="meal-item__amount">{item.amount}{item.unit === "piece" ? t("common.pieceShort") : item.unit}</span>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="meal-card__footer">
        <span>{equipment}</span>
        <div>
          <button className="meal-action" type="button" onClick={onOpenRecipe}>{t("meal.recipe")}</button>
          <button className="meal-action" type="button" aria-pressed={editingPortions} onClick={() => setEditingPortions((value) => !value)}>
            {editingPortions ? t("action.done") : t("meal.editPortions")}
          </button>
          <button className="meal-action meal-action--primary" type="button" onClick={onRegenerate}>{t("meal.regenerate")}</button>
        </div>
      </footer>
    </article>
  );
}
