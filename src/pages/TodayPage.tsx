import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { MealCard } from "../components/MealCard";
import { NutritionSummary } from "../components/NutritionSummary";
import { getMealMissingIngredients } from "../engine/shoppingEngine";
import { selectActiveDailyPlan, useAppStore } from "../stores/useAppStore";
import type { MealType } from "../types";
import type { PlanningMode } from "../utils/planningMode";

interface TodayPageProps {
  onOpenFoods: () => void;
  onOpenRecipe: (mealType: MealType) => void;
}

interface SwipeStart {
  pointerId: number;
  x: number;
  y: number;
}

const SWIPE_THRESHOLD = 64;
const SWIPE_AXIS_RATIO = 1.35;

const isInteractiveTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest("button, input, select, textarea, a, [role='button']"));

const displayDate = (dateKey?: string): string => {
  const date = dateKey ? new Date(`${dateKey}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
};

function PlanningModeControl({
  mode,
  onChange,
}: {
  mode: PlanningMode;
  onChange: (mode: PlanningMode) => void;
}) {
  return (
    <fieldset className="planning-mode">
      <legend className="sr-only">Planning mode</legend>
      <div>
        <button
          type="button"
          className={mode === "free" ? "is-active" : ""}
          aria-pressed={mode === "free"}
          onClick={() => onChange("free")}
        >
          Plan Freely
        </button>
        <button
          type="button"
          className={mode === "inventory" ? "is-active" : ""}
          aria-pressed={mode === "inventory"}
          onClick={() => onChange("inventory")}
        >
          Use What I Have
        </button>
      </div>
    </fieldset>
  );
}

export function TodayPage({ onOpenFoods, onOpenRecipe }: TodayPageProps) {
  const profile = useAppStore((state) => state.profile);
  const foods = useAppStore((state) => state.foods);
  const dailyPlan = useAppStore(selectActiveDailyPlan);
  const activePlanningMode = useAppStore((state) => state.activePlanningMode);
  const generationMessage = useAppStore((state) => state.generationMessage);
  const setActivePlanningMode = useAppStore((state) => state.setActivePlanningMode);
  const generateDailyPlan = useAppStore((state) => state.generateDailyPlan);
  const regenerateMeal = useAppStore((state) => state.regenerateMeal);
  const toggleMealItemLock = useAppStore((state) => state.toggleMealItemLock);
  const updateMealItemPortion = useAppStore((state) => state.updateMealItemPortion);
  const clearGenerationMessage = useAppStore((state) => state.clearGenerationMessage);
  const swipeStart = useRef<SwipeStart | null>(null);

  const startPlanningModeSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || isInteractiveTarget(event.target)) return;
    swipeStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const finishPlanningModeSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;

    const horizontalDistance = event.clientX - start.x;
    const verticalDistance = event.clientY - start.y;
    if (
      Math.abs(horizontalDistance) < SWIPE_THRESHOLD
      || Math.abs(horizontalDistance) < Math.abs(verticalDistance) * SWIPE_AXIS_RATIO
    ) return;

    setActivePlanningMode(horizontalDistance < 0 ? "inventory" : "free");
  };

  const renderMeal = (mealType: MealType) => {
    if (!dailyPlan) return null;
    return (
      <MealCard
        key={mealType}
        meal={dailyPlan[mealType]}
        foods={foods}
        missingIngredientCount={getMealMissingIngredients(dailyPlan[mealType], foods).length}
        onOpenRecipe={() => onOpenRecipe(mealType)}
        onRegenerate={() => regenerateMeal(mealType)}
        onToggleLock={(foodId) => toggleMealItemLock(mealType, foodId)}
        onUpdatePortion={(foodId, amount) => updateMealItemPortion(mealType, foodId, amount)}
      />
    );
  };

  return (
    <div className="today-page">
      <section className="today-intro">
        <div>
          <p className="today-date">{displayDate(dailyPlan?.date)}</p>
          <p>{dailyPlan ? "A flexible plan built from your food library." : "Let your food library take the thinking out of today."}</p>
        </div>
      </section>

      {generationMessage && (
        <section className="generation-notice" role="status">
          <div><strong>We couldn't build that plan yet</strong><p>{generationMessage}</p></div>
          <div>
            <button type="button" className="text-button" onClick={clearGenerationMessage}>Dismiss</button>
            <button type="button" className="secondary-button" onClick={onOpenFoods}>Go to Foods</button>
          </div>
        </section>
      )}

      <div
        className="planning-surface"
        onPointerDown={startPlanningModeSwipe}
        onPointerUp={finishPlanningModeSwipe}
        onPointerCancel={() => { swipeStart.current = null; }}
      >
        <div className={`planning-overview${dailyPlan ? " planning-overview--with-summary" : ""}`}>
          <PlanningModeControl mode={activePlanningMode} onChange={setActivePlanningMode} />
          {dailyPlan && <NutritionSummary plan={dailyPlan} profile={profile} />}
        </div>

        {dailyPlan ? (
          <section className="daily-meals" aria-label="Today's meals">
            {renderMeal("breakfast")}
            {renderMeal("lunch")}
            {renderMeal("snack")}
          </section>
        ) : (
          <section className="today-empty">
            <div className="today-empty__art" aria-hidden="true"><span>○</span><span>△</span><span>□</span></div>
            <p className="section-kicker">{activePlanningMode === "free" ? "Plan Freely" : "Use What I Have"}</p>
            <h2>No plan for this mode yet</h2>
            <p>{activePlanningMode === "free"
              ? "Generate a balanced day using all foods in My Foods."
              : "Generate a balanced day using foods currently marked In Stock."}</p>
            <button className="primary-button generate-button" type="button" onClick={generateDailyPlan}>Generate My Day</button>
          </section>
        )}
      </div>

      {dailyPlan && (
        <section className="generate-panel">
          <div><p className="section-kicker">Want a fresh direction?</p><h2>Generate another balanced day</h2></div>
          <button className="primary-button generate-button" type="button" onClick={generateDailyPlan}>Generate My Day</button>
        </section>
      )}
    </div>
  );
}
