import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import {
  createUserFoodsFromReferences,
  findReferenceDuplicate,
} from "../data/foodFactory";
import {
  browseReferenceFoods,
  getReferenceFoodCategoryCounts,
  searchReferenceFoods,
  type ReferenceFoodCategoryFilter,
} from "../data/referenceFoodSearch";
import { referenceFoods } from "../data/seedFoods";
import { useLocale } from "../i18n/useLocale";
import { useAppStore } from "../stores/useAppStore";
import type { Food, ReferenceFood } from "../types";
import { FOOD_CATEGORIES } from "../utils/foodOptions";

interface AddFoodPageProps {
  onSelectReference: (referenceFoodId: string) => void;
  onAddCustom: () => void;
  onViewExisting: (foodId: string) => void;
  onMultiAddComplete: (count: number) => void;
}

const basisLabel = {
  per_100g: "100g",
  per_100ml: "100ml",
  per_unit: "piece",
};

export function AddFoodPage({ onSelectReference, onAddCustom, onViewExisting, onMultiAddComplete }: AddFoodPageProps) {
  const { categoryName, locale, referenceFoodName, t } = useLocale();
  const foods = useAppStore((state) => state.foods);
  const addFoods = useAppStore((state) => state.addFoods);
  const [search, setSearch] = useState("");
  const [duplicate, setDuplicate] = useState<{ reference: ReferenceFood; existing: Food }>();
  const [multiSelect, setMultiSelect] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const [category, setCategory] = useState<ReferenceFoodCategoryFilter>("all");
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);

  const visibleReferences = useMemo(
    () => browseAll ? browseReferenceFoods(search, category, locale) : searchReferenceFoods(search, locale),
    [browseAll, category, locale, search],
  );
  const categoryCounts = useMemo(getReferenceFoodCategoryCounts, []);
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

  const startMultiSelect = () => {
    setMultiSelect(true);
    setDuplicate(undefined);
  };

  const cancelMultiSelect = () => {
    setMultiSelect(false);
    setBrowseAll(false);
    setCategory("all");
    setSelectedReferenceIds([]);
    setDuplicate(undefined);
  };

  const openBrowseAll = () => {
    setBrowseAll(true);
    setMultiSelect(true);
    setSearch("");
    setCategory("all");
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
    setSelectedReferenceIds([]);
    onMultiAddComplete(additions.length);
  };

  return (
    <div className="add-food-start">
      <section className="add-food-lead">
        <h2>{t("addFood.leadTitle")}</h2>
        <p>{t("addFood.leadBody")}</p>
      </section>

      <label className="search-field search-field--large">
        <Icon name="search" />
        <span className="sr-only">{t("addFood.searchA11y")}</span>
        <input autoFocus value={search} onChange={(event) => { setSearch(event.target.value); setDuplicate(undefined); }} placeholder={t("addFood.searchPlaceholder")} />
      </label>

      {!multiSelect && duplicate && (
        <aside className="duplicate-notice" role="status">
          <div><strong>{t("addFood.duplicateTitle", { name: referenceFoodName(duplicate.reference) })}</strong><span>{t("addFood.duplicateBody")}</span></div>
          <div>
            <button type="button" className="secondary-button" onClick={() => onViewExisting(duplicate.existing.id)}>{t("addFood.viewExisting")}</button>
            <button type="button" className="text-button" onClick={() => onSelectReference(duplicate.reference.id)}>{t("addFood.addAnyway")}</button>
          </div>
        </aside>
      )}

      <section className="common-food-section">
        <div className="list-heading">
          <h2>{t(browseAll ? "addFood.browseTitle" : "addFood.commonFoods")}</h2>
          <div className="list-heading__actions">
            <span>{browseAll || search ? t("addFood.matches", { count: visibleReferences.length }) : t("addFood.popularPicks")}</span>
            {multiSelect
              ? <button type="button" className="text-button" onClick={cancelMultiSelect}>{t("action.cancel")}</button>
              : <button type="button" className="text-button" onClick={startMultiSelect}>{t("addFood.selectMultiple")}</button>}
          </div>
        </div>
        {browseAll && (
          <>
            <p className="reference-browser__intro">{t("addFood.browseBody")}</p>
            <div className="filter-scroll reference-browser__filters" aria-label={t("addFood.categoryFilters")}>
              <button type="button" className={category === "all" ? "filter-chip is-active" : "filter-chip"} onClick={() => setCategory("all")}>
                {t("foods.all")} <span>{categoryCounts.all}</span>
              </button>
              {FOOD_CATEGORIES.map((option) => (
                <button type="button" key={option.value} className={category === option.value ? "filter-chip is-active" : "filter-chip"} onClick={() => setCategory(option.value)}>
                  {categoryName(option.value)} <span>{categoryCounts[option.value]}</span>
                </button>
              ))}
            </div>
          </>
        )}
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
                  <span className="reference-food-row__copy"><strong>{referenceFoodName(food)}</strong><span>{categoryName(food.category)} · {alreadyAdded ? t("addFood.alreadyAdded") : t("common.referenceNutrition")}</span></span>
                  <span className="reference-food-row__nutrition">≈{food.nutrition.calories}<small>kcal / {basisLabel[food.nutritionBasis]}</small></span>
                  <span className="reference-food-row__selection" aria-hidden="true">{alreadyAdded ? t("addFood.added") : selected ? "✓" : ""}</span>
                </label>
              );
            }
            return (
              <button type="button" className="reference-food-row" key={food.id} onClick={() => selectReference(food)}>
                <span className={`reference-food-row__mark category-dot--${food.category}`}>{referenceFoodName(food).charAt(0)}</span>
                <span className="reference-food-row__copy"><strong>{referenceFoodName(food)}</strong><span>{categoryName(food.category)} · {t("common.referenceNutrition")}</span></span>
                <span className="reference-food-row__nutrition">≈{food.nutrition.calories}<small>kcal / {basisLabel[food.nutritionBasis]}</small></span>
                <span className="reference-food-row__arrow" aria-hidden="true">›</span>
              </button>
            );
          })}
          {visibleReferences.length === 0 && (
            <div className="common-empty"><strong>{t("addFood.noMatchTitle", { query: search })}</strong><span>{t("addFood.noMatchBody")}</span></div>
          )}
        </div>
      </section>

      {multiSelect && (
        <div className="multi-add-bar">
          <span>{t("addFood.selected", { count: selectedReferenceIds.length })}</span>
          <button className="primary-button" type="button" disabled={selectedReferenceIds.length === 0} onClick={addSelectedReferences}>
            {t("addFood.addSelected", { count: selectedReferenceIds.length })}
          </button>
        </div>
      )}

      {!browseAll && (
        <section className="reference-browser-entry">
          <div>
            <span className="section-kicker">{t("addFood.buildKicker")}</span>
            <h2>{t("addFood.buildTitle")}</h2>
            <p>{t("addFood.buildBody")}</p>
          </div>
          <button type="button" className="secondary-button" onClick={openBrowseAll}>{t("addFood.browseAll")} <span aria-hidden="true">›</span></button>
        </section>
      )}

      <section className="custom-food-callout">
        <div><span className="section-kicker">{t("addFood.cantFind")}</span><h2>{t("addFood.packageTitle")}</h2><p>{t("addFood.packageBody")}</p></div>
        <button type="button" className="secondary-button" onClick={onAddCustom}>{t("addFood.addCustom")} <span aria-hidden="true">›</span></button>
      </section>
    </div>
  );
}
