import type { DailyPlan, TargetStatus, UserProfile } from "../types";
import { useLocale } from "../i18n/useLocale";

interface NutritionSummaryProps {
  plan: DailyPlan;
  profile: UserProfile;
}

export function NutritionSummary({ plan, profile }: NutritionSummaryProps) {
  const { locale, t } = useLocale();
  const rounded = (value: number): string => Math.round(value).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-GB");
  const statusLabel = (status: TargetStatus): string => t(`status.${status}`);
  const fibreValue = `${plan.fibreDataComplete ? "" : "≥"}${rounded(plan.totalNutrition.fibre ?? 0)}g`;
  return (
    <section className="daily-nutrition" aria-labelledby="nutrition-overview-title">
      <div className="daily-nutrition__heading">
        <div>
          <p className="section-kicker">{t("nutrition.overview")}</p>
          <h2 id="nutrition-overview-title">{t("nutrition.dayHeading")}</h2>
        </div>
        <span>{t("nutrition.planNotDiary")}</span>
      </div>
      <div className="daily-nutrition__grid">
        <article className="nutrition-stat nutrition-stat--energy">
          <span>{t("nutrition.calories")}</span>
          <strong>{rounded(plan.totalNutrition.calories)} <small>kcal</small></strong>
          <p className={`target-status target-status--${plan.nutritionStatus.calories}`}>{statusLabel(plan.nutritionStatus.calories)}</p>
          <small>{t("nutrition.target")} {rounded(profile.calorieTarget.min)}–{rounded(profile.calorieTarget.max)} kcal</small>
        </article>
        <article className="nutrition-stat">
          <span>{t("nutrition.protein")}</span>
          <strong>{rounded(plan.totalNutrition.protein)}g</strong>
          <p className={`target-status target-status--${plan.nutritionStatus.protein}`}>{statusLabel(plan.nutritionStatus.protein)}</p>
          <small>{t("nutrition.target")} {profile.proteinTarget.min}–{profile.proteinTarget.max}g</small>
        </article>
        <article className="nutrition-stat">
          <span>{t("nutrition.fibre")}</span>
          <strong>{fibreValue}</strong>
          <p className={`target-status target-status--${plan.nutritionStatus.fibre}`}>{statusLabel(plan.nutritionStatus.fibre)}</p>
          <small>{plan.fibreDataComplete ? `${t("nutrition.target")} ≈${profile.fibreTarget}g` : t(locale === "zh-CN" ? "nutrition.partialDetail" : "nutrition.knownAoacOnly")}</small>
        </article>
        <article className="nutrition-stat">
          <span>{t("nutrition.fruitVeg")}</span>
          <strong>{plan.fruitVegPortions.toFixed(1)} <small>{t("nutrition.portions")}</small></strong>
          <p className={`target-status target-status--${plan.nutritionStatus.fruitVeg}`}>{statusLabel(plan.nutritionStatus.fruitVeg)}</p>
          <small>{t("nutrition.target")} {profile.fruitVegTargetPortions}+ {t("nutrition.portions")}</small>
        </article>
      </div>
    </section>
  );
}
