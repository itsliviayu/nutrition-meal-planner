import { useState, type FormEvent } from "react";
import { PortionNutritionPreview } from "../components/PortionNutritionPreview";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/seedFoods";
import { useLocale } from "../i18n/useLocale";
import { useAppStore } from "../stores/useAppStore";
import { createId } from "../utils/id";
import { parseNumericDraft } from "../utils/foodFormDraft";

interface ConfirmCommonFoodPageProps {
  referenceFoodId?: string;
  onDone: () => void;
  onBack: () => void;
  onCustomize: (referenceFoodId: string) => void;
}

export function ConfirmCommonFoodPage({ referenceFoodId, onDone, onBack, onCustomize }: ConfirmCommonFoodPageProps) {
  const { categoryName, referenceFoodName, t } = useLocale();
  const referenceFood = referenceFoods.find((food) => food.id === referenceFoodId);
  const addFood = useAppStore((state) => state.addFood);
  const [defaultServing, setDefaultServing] = useState(String(referenceFood?.defaultServing ?? 100));
  const [store, setStore] = useState("");
  const [inStock, setInStock] = useState(true);
  const [regularBuy, setRegularBuy] = useState(false);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState("");

  if (!referenceFood) {
    return <section className="empty-state"><h2>{t("confirm.notFound")}</h2><button className="primary-button" type="button" onClick={onBack}>{t("confirm.backSearch")}</button></section>;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedServing = parseNumericDraft(defaultServing);
    if (parsedServing === undefined || parsedServing <= 0) {
      setError(t("confirm.invalidServing"));
      return;
    }
    addFood(createUserFoodFromReference(referenceFood, {
      id: createId(),
      defaultServing: parsedServing,
      store,
      inStock,
      regularBuy,
      favourite,
    }));
    onDone();
  };

  return (
    <form className="quick-confirm" onSubmit={handleSubmit} noValidate>
      <section className="quick-confirm__identity">
        <span className={`reference-food-row__mark reference-food-row__mark--large category-dot--${referenceFood.category}`}>{referenceFoodName(referenceFood).charAt(0)}</span>
        <div><span className="section-kicker">{t("confirm.referenceNutrition")}</span><h2>{referenceFoodName(referenceFood)}</h2><p>{categoryName(referenceFood.category)} · {t("common.standardEstimate")}</p><small>{referenceFood.referenceSourceName}</small></div>
      </section>

      <PortionNutritionPreview food={referenceFood} amount={parseNumericDraft(defaultServing) ?? 0} unit={referenceFood.servingUnit} />

      <section className="quick-confirm__fields">
        <label className="field"><span>{t("confirm.defaultServing")}</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0.01" step="any" value={defaultServing} onChange={(event) => setDefaultServing(event.target.value)} /><span>{referenceFood.servingUnit === "piece" ? t("confirm.pieces") : referenceFood.servingUnit}</span></div><small>{t("confirm.servingHelp")}</small></label>
        <label className="field"><span>{t("confirm.store")} <em>{t("common.optional")}</em></span><input value={store} onChange={(event) => setStore(event.target.value)} placeholder={t("confirm.storePlaceholder")} /></label>
      </section>

      <section className="quick-confirm__status">
        <label className="check-tile"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} /><span>{t("confirm.inStock")}</span></label>
        <label className="check-tile"><input type="checkbox" checked={regularBuy} onChange={(event) => setRegularBuy(event.target.checked)} /><span>{t("confirm.regularBuy")}</span></label>
        <label className="check-tile"><input type="checkbox" checked={favourite} onChange={(event) => setFavourite(event.target.checked)} /><span>{t("confirm.favourite")}</span></label>
      </section>

      {error && <div className="form-errors" role="alert">{error}</div>}
      <div className="quick-confirm__actions">
        <button type="button" className="text-button" onClick={onBack}>{t("action.back")}</button>
        <button type="button" className="secondary-button" onClick={() => onCustomize(referenceFood.id)}>{t("confirm.addCustomize")}</button>
        <button type="submit" className="primary-button">{t("confirm.add")}</button>
      </div>
    </form>
  );
}
