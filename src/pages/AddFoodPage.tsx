import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import {
  createUserFoodsFromReferences,
  findReferenceDuplicate,
} from "../data/foodFactory";
import { searchReferenceFoods } from "../data/referenceFoodSearch";
import { referenceFoods } from "../data/seedFoods";
import { useAppStore } from "../stores/useAppStore";
import type { Food, ReferenceFood } from "../types";
import { categoryLabel } from "../utils/foodOptions";

interface AddFoodPageProps {
  onSelectReference: (referenceFoodId: string) => void;
  onAddCustom: () => void;
  onViewExisting: (foodId: string) => void;
  onMultiAddComplete: () => void;
}

const basisLabel = {
  per_100g: "100g",
  per_100ml: "100ml",
  per_unit: "piece",
};

export function AddFoodPage({ onSelectReference, onAddCustom, onViewExisting, onMultiAddComplete }: AddFoodPageProps) {
  const foods = useAppStore((state) => state.foods);
  const addFoods = useAppStore((state) => state.addFoods);
  const [search, setSearch] = useState("");
  const [duplicate, setDuplicate] = useState<{ reference: ReferenceFood; existing: Food }>();
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);

  const visibleReferences = useMemo(() => searchReferenceFoods(search), [search]);
  const existingReferenceIds = useMemo(() => new Set(
    referenceFoods
      .filter((reference) => findReferenceDuplicate(foods, reference))
      .map((reference) => reference.id),
  ), [foods]);

  const selectReference = (reference: ReferenceFood) => {
    const existing = findReferenceDuplicate(foods, reference);
    if (existing) {
      setDuplicate({ reference, existing });
      return;
    }
    onSelectReference(reference.id);
  };

  const toggleMultiSelect = () => {
    setMultiSelect((current) => !current);
    setSelectedReferenceIds([]);
    setDuplicate(undefined);
  };

  const toggleReference = (referenceFoodId: string) => {
    if (existingReferenceIds.has(referenceFoodId)) return;
    setSelectedReferenceIds((current) => current.includes(referenceFoodId)
      ? current.filter((id) => id !== referenceFoodId)
      : [...current, referenceFoodId]);
  };

  const addSelectedReferences = () => {
    const selectedReferences = selectedReferenceIds.flatMap((id) => {
      const reference = referenceFoods.find((food) => food.id === id);
      return reference ? [reference] : [];
    });
    const additions = createUserFoodsFromReferences(selectedReferences, foods);
    if (additions.length === 0) return;
    addFoods(additions);
    onMultiAddComplete();
  };

  return (
    <div className="add-food-start">
      <section className="add-food-lead">
        <h2>Start with something familiar</h2>
        <p>Choose a common food and its reference nutrition is filled in for you.</p>
      </section>

      <label className="search-field search-field--large">
        <Icon name="search" />
        <span className="sr-only">Search common foods</span>
        <input autoFocus value={search} onChange={(event) => { setSearch(event.target.value); setDuplicate(undefined); }} placeholder="Search common foods..." />
      </label>

      {!multiSelect && duplicate && (
        <aside className="duplicate-notice" role="status">
          <div><strong>{duplicate.reference.name} is already in your food library.</strong><span>You can update the existing food or keep a separate copy.</span></div>
          <div>
            <button type="button" className="secondary-button" onClick={() => onViewExisting(duplicate.existing.id)}>View existing food</button>
            <button type="button" className="text-button" onClick={() => onSelectReference(duplicate.reference.id)}>Add anyway</button>
          </div>
        </aside>
      )}

      <section className="common-food-section">
        <div className="list-heading">
          <h2>Common foods</h2>
          <div className="list-heading__actions">
            <span>{search ? `${visibleReferences.length} matches` : "Popular picks"}</span>
            <button type="button" className="text-button" onClick={toggleMultiSelect}>{multiSelect ? "Cancel" : "Select multiple"}</button>
          </div>
        </div>
        <div className="reference-list">
          {visibleReferences.map((food) => {
            const alreadyAdded = existingReferenceIds.has(food.id);
            const selected = selectedReferenceIds.includes(food.id);
            if (multiSelect) {
              return (
                <label
                  className={`reference-food-row reference-food-row--selectable${selected ? " is-selected" : ""}${alreadyAdded ? " is-disabled" : ""}`}
                  key={food.id}
                >
                  <input
                    className="reference-food-checkbox"
                    type="checkbox"
                    checked={selected}
                    disabled={alreadyAdded}
                    onChange={() => toggleReference(food.id)}
                  />
                  <span className="reference-food-row__copy"><strong>{food.name}</strong><span>{categoryLabel(food.category)} · {alreadyAdded ? "Already added" : "Reference nutrition"}</span></span>
                  <span className="reference-food-row__nutrition">≈{food.nutrition.calories}<small>kcal / {basisLabel[food.nutritionBasis]}</small></span>
                  <span className="reference-food-row__selection" aria-hidden="true">{alreadyAdded ? "Added" : selected ? "✓" : ""}</span>
                </label>
              );
            }
            return (
              <button type="button" className="reference-food-row" key={food.id} onClick={() => selectReference(food)}>
                <span className={`reference-food-row__mark category-dot--${food.category}`}>{food.name.charAt(0)}</span>
                <span className="reference-food-row__copy"><strong>{food.name}</strong><span>{categoryLabel(food.category)} · Reference nutrition</span></span>
                <span className="reference-food-row__nutrition">≈{food.nutrition.calories}<small>kcal / {basisLabel[food.nutritionBasis]}</small></span>
                <span className="reference-food-row__arrow" aria-hidden="true">›</span>
              </button>
            );
          })}
          {visibleReferences.length === 0 && (
            <div className="common-empty"><strong>No common food matches “{search}”</strong><span>You can still add it using values from a package label or your own estimate.</span></div>
          )}
        </div>
      </section>

      {multiSelect && (
        <div className="multi-add-bar">
          <span>{selectedReferenceIds.length} selected</span>
          <button className="primary-button" type="button" disabled={selectedReferenceIds.length === 0} onClick={addSelectedReferences}>
            Add {selectedReferenceIds.length} to My Foods
          </button>
        </div>
      )}

      <section className="custom-food-callout">
        <div><span className="section-kicker">Can’t find it?</span><h2>Using a package label?</h2><p>Add a branded food, ready meal, sauce, or your own estimate with the full nutrition form.</p></div>
        <button type="button" className="secondary-button" onClick={onAddCustom}>Add packaged or custom food <span aria-hidden="true">›</span></button>
      </section>
    </div>
  );
}
