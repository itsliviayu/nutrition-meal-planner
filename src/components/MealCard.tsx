import { useEffect, useState } from "react";
import type { Food, MealPlan } from "../types";

interface MealCardProps {
  meal: MealPlan;
  foods: Food[];
  onRegenerate: () => void;
  onOpenRecipe: () => void;
  onToggleLock: (foodId: string) => void;
  onUpdatePortion: (foodId: string, amount: number) => void;
}

const mealLabel: Record<MealPlan["type"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Evening snack",
};

const unitLabel = (unit: MealPlan["items"][number]["unit"]): string =>
  unit === "piece" ? "pc" : unit;

function PortionInput({
  amount,
  unit,
  label,
  onChange,
}: {
  amount: number;
  unit: MealPlan["items"][number]["unit"];
  label: string;
  onChange: (amount: number) => void;
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
      <button type="button" aria-label={`Reduce ${label} portion`} onClick={() => commit(String(Math.max(step, amount - step)))}>−</button>
      <label>
        <span className="sr-only">{label} portion</span>
        <input type="number" min={step} step={step} value={draft} onChange={(event) => commit(event.target.value)} />
        <small>{unitLabel(unit)}</small>
      </label>
      <button type="button" aria-label={`Increase ${label} portion`} onClick={() => commit(String(amount + step))}>+</button>
    </div>
  );
}

export function MealCard({ meal, foods, onRegenerate, onOpenRecipe, onToggleLock, onUpdatePortion }: MealCardProps) {
  const [editingPortions, setEditingPortions] = useState(false);
  const equipment = meal.equipment.length ? meal.equipment.join(" · ") : "No special equipment";

  return (
    <article className="meal-card">
      <header className="meal-card__header">
        <div>
          <p className="section-kicker">{mealLabel[meal.type]}</p>
          <h2>{meal.name}</h2>
          <span>{Math.round(meal.nutrition.calories)} kcal · {Math.round(meal.nutrition.protein)}g protein</span>
        </div>
        <div className="meal-card__time"><strong>{meal.cookingTime}</strong><span>min</span></div>
      </header>

      <ul className="meal-items">
        {meal.items.map((item) => {
          const food = foods.find((candidate) => candidate.id === item.foodId);
          const name = food?.name ?? "Unavailable food";
          return (
            <li key={item.foodId}>
              <button
                className={item.locked ? "lock-button is-locked" : "lock-button"}
                type="button"
                aria-label={`${item.locked ? "Unlock" : "Lock"} ${name}`}
                aria-pressed={item.locked}
                onClick={() => onToggleLock(item.foodId)}
              >
                <span aria-hidden="true">{item.locked ? "●" : "○"}</span>
              </button>
              <div className="meal-item__name"><strong>{name}</strong><span>{item.locked ? "Locked for regenerate" : "Can be varied"}</span></div>
              {editingPortions ? (
                <PortionInput amount={item.amount} unit={item.unit} label={name} onChange={(amount) => onUpdatePortion(item.foodId, amount)} />
              ) : (
                <span className="meal-item__amount">{item.amount}{unitLabel(item.unit)}</span>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="meal-card__footer">
        <span>{equipment}</span>
        <div>
          <button className="meal-action" type="button" onClick={onOpenRecipe}>Recipe</button>
          <button className="meal-action" type="button" aria-pressed={editingPortions} onClick={() => setEditingPortions((value) => !value)}>
            {editingPortions ? "Done" : "Edit portions"}
          </button>
          <button className="meal-action meal-action--primary" type="button" onClick={onRegenerate}>Regenerate</button>
        </div>
      </footer>
    </article>
  );
}
