import { MealCard } from "../components/MealCard";
import { NutritionSummary } from "../components/NutritionSummary";
import { useAppStore } from "../stores/useAppStore";
import type { MealType } from "../types";

interface TodayPageProps {
  onOpenFoods: () => void;
}

const displayDate = (dateKey?: string): string => {
  const date = dateKey ? new Date(`${dateKey}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
};

export function TodayPage({ onOpenFoods }: TodayPageProps) {
  const profile = useAppStore((state) => state.profile);
  const foods = useAppStore((state) => state.foods);
  const dailyPlan = useAppStore((state) => state.dailyPlan);
  const inventoryOnly = useAppStore((state) => state.inventoryOnly);
  const generationMessage = useAppStore((state) => state.generationMessage);
  const setInventoryOnly = useAppStore((state) => state.setInventoryOnly);
  const generateDailyPlan = useAppStore((state) => state.generateDailyPlan);
  const regenerateMeal = useAppStore((state) => state.regenerateMeal);
  const toggleMealItemLock = useAppStore((state) => state.toggleMealItemLock);
  const updateMealItemPortion = useAppStore((state) => state.updateMealItemPortion);
  const clearGenerationMessage = useAppStore((state) => state.clearGenerationMessage);

  const renderMeal = (mealType: MealType) => {
    if (!dailyPlan) return null;
    return (
      <MealCard
        key={mealType}
        meal={dailyPlan[mealType]}
        foods={foods}
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
        <label className="inventory-switch">
          <input type="checkbox" checked={inventoryOnly} onChange={(event) => setInventoryOnly(event.target.checked)} />
          <span>In-stock only</span>
        </label>
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

      {dailyPlan ? (
        <>
          <NutritionSummary plan={dailyPlan} profile={profile} />
          <section className="daily-meals" aria-label="Today's meals">
            {renderMeal("breakfast")}
            {renderMeal("lunch")}
            {renderMeal("snack")}
          </section>
        </>
      ) : (
        <section className="today-empty">
          <div className="today-empty__art" aria-hidden="true"><span>○</span><span>△</span><span>□</span></div>
          <p className="section-kicker">Breakfast · Lunch · Evening snack</p>
          <h2>Make room for a good day</h2>
          <p>We'll combine foods you own into three practical meals, then balance the day around your personal targets.</p>
          <button className="primary-button generate-button" type="button" onClick={generateDailyPlan}>Generate My Day</button>
        </section>
      )}

      {dailyPlan && (
        <section className="generate-panel">
          <div><p className="section-kicker">Want a fresh direction?</p><h2>Generate another balanced day</h2></div>
          <button className="primary-button generate-button" type="button" onClick={generateDailyPlan}>Generate My Day</button>
        </section>
      )}
    </div>
  );
}
