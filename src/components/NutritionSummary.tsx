import type { DailyPlan, TargetStatus, UserProfile } from "../types";

interface NutritionSummaryProps {
  plan: DailyPlan;
  profile: UserProfile;
}

const statusLabel: Record<TargetStatus, string> = {
  good: "Within target",
  close: "Close to target",
  low: "Could use a little more",
  high: "Above your planning range",
  partial: "Partial data",
};

const rounded = (value: number): string => Math.round(value).toLocaleString("en-GB");

export function NutritionSummary({ plan, profile }: NutritionSummaryProps) {
  const fibreValue = `${plan.fibreDataComplete ? "" : "≥"}${rounded(plan.totalNutrition.fibre ?? 0)}g`;
  return (
    <section className="daily-nutrition" aria-labelledby="nutrition-overview-title">
      <div className="daily-nutrition__heading">
        <div>
          <p className="section-kicker">Nutrition overview</p>
          <h2 id="nutrition-overview-title">A gentle view of the day</h2>
        </div>
        <span>Plan, not a diary</span>
      </div>
      <div className="daily-nutrition__grid">
        <article className="nutrition-stat nutrition-stat--energy">
          <span>Calories</span>
          <strong>{rounded(plan.totalNutrition.calories)} <small>kcal</small></strong>
          <p className={`target-status target-status--${plan.nutritionStatus.calories}`}>{statusLabel[plan.nutritionStatus.calories]}</p>
          <small>Target {profile.calorieTarget.min.toLocaleString("en-GB")}–{profile.calorieTarget.max.toLocaleString("en-GB")} kcal</small>
        </article>
        <article className="nutrition-stat">
          <span>Protein</span>
          <strong>{rounded(plan.totalNutrition.protein)}g</strong>
          <p className={`target-status target-status--${plan.nutritionStatus.protein}`}>{statusLabel[plan.nutritionStatus.protein]}</p>
          <small>Target {profile.proteinTarget.min}–{profile.proteinTarget.max}g</small>
        </article>
        <article className="nutrition-stat">
          <span>Fibre</span>
          <strong>{fibreValue}</strong>
          <p className={`target-status target-status--${plan.nutritionStatus.fibre}`}>{statusLabel[plan.nutritionStatus.fibre]}</p>
          <small>{plan.fibreDataComplete ? `Target ≈${profile.fibreTarget}g` : "Known AOAC fibre only"}</small>
        </article>
        <article className="nutrition-stat">
          <span>Fruit &amp; Veg</span>
          <strong>{plan.fruitVegPortions.toFixed(1)} <small>portions</small></strong>
          <p className={`target-status target-status--${plan.nutritionStatus.fruitVeg}`}>{statusLabel[plan.nutritionStatus.fruitVeg]}</p>
          <small>Target {profile.fruitVegTargetPortions}+ portions</small>
        </article>
      </div>
    </section>
  );
}
