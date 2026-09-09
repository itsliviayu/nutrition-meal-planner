import { useState, type FormEvent } from "react";
import { PortionNutritionPreview } from "../components/PortionNutritionPreview";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/seedFoods";
import { useAppStore } from "../stores/useAppStore";
import { categoryLabel } from "../utils/foodOptions";
import { createId } from "../utils/id";

interface ConfirmCommonFoodPageProps {
  referenceFoodId?: string;
  onDone: () => void;
  onBack: () => void;
}

export function ConfirmCommonFoodPage({ referenceFoodId, onDone, onBack }: ConfirmCommonFoodPageProps) {
  const referenceFood = referenceFoods.find((food) => food.id === referenceFoodId);
  const addFood = useAppStore((state) => state.addFood);
  const [defaultServing, setDefaultServing] = useState(referenceFood?.defaultServing ?? 100);
  const [store, setStore] = useState("");
  const [inStock, setInStock] = useState(true);
  const [regularBuy, setRegularBuy] = useState(false);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState("");

  if (!referenceFood) {
    return <section className="empty-state"><h2>Reference food not found</h2><button className="primary-button" type="button" onClick={onBack}>Back to search</button></section>;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(defaultServing) || defaultServing <= 0) {
      setError("Default serving must be greater than zero.");
      return;
    }
    addFood(createUserFoodFromReference(referenceFood, {
      id: createId(),
      defaultServing,
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
        <span className={`reference-food-row__mark reference-food-row__mark--large category-dot--${referenceFood.category}`}>{referenceFood.name.charAt(0)}</span>
        <div><span className="section-kicker">Reference nutrition</span><h2>{referenceFood.name}</h2><p>{categoryLabel(referenceFood.category)} · Standard estimate</p></div>
      </section>

      <PortionNutritionPreview food={referenceFood} amount={defaultServing} unit={referenceFood.servingUnit} />

      <section className="quick-confirm__fields">
        <label className="field"><span>Default serving</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0.01" step="any" value={defaultServing} onChange={(event) => setDefaultServing(Number(event.target.value))} /><span>{referenceFood.servingUnit === "piece" ? "pieces" : referenceFood.servingUnit}</span></div><small>The amount you would usually use in a meal—not the package size.</small></label>
        <label className="field"><span>Store <em>Optional</em></span><input value={store} onChange={(event) => setStore(event.target.value)} placeholder="e.g. Lidl" /></label>
      </section>

      <section className="quick-confirm__status">
        <label className="check-tile"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} /><span>In stock</span></label>
        <label className="check-tile"><input type="checkbox" checked={regularBuy} onChange={(event) => setRegularBuy(event.target.checked)} /><span>Regular buy</span></label>
        <label className="check-tile"><input type="checkbox" checked={favourite} onChange={(event) => setFavourite(event.target.checked)} /><span>Favourite</span></label>
      </section>

      {error && <div className="form-errors" role="alert">{error}</div>}
      <div className="quick-confirm__actions"><button type="button" className="secondary-button" onClick={onBack}>Back</button><button type="submit" className="primary-button">Add to My Foods</button></div>
    </form>
  );
}
