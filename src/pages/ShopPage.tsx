import { useMemo, useState } from "react";
import { referenceFoods } from "../data/seedFoods";
import { recipeTemplates } from "../data/recipeTemplates";
import {
  excludePlanNeededSuggestions,
  getBuyAgainSuggestions,
  getPlanNeededFoods,
  getSuggestionBatch,
  getTrySomethingNewSuggestions,
  shoppingIdentityKey,
} from "../engine/shoppingEngine";
import { selectActiveDailyPlan, useAppStore } from "../stores/useAppStore";
import { getReferenceFoodDisplayName } from "../i18n/locale";
import { getRecipeTemplateDisplayName } from "../i18n/recipeLocalizations";
import { useLocale } from "../i18n/useLocale";
import type { ShoppingItemSource } from "../types";

export function ShopPage() {
  const { categoryName, foodName, list, locale, mealName, referenceFoodName, t } = useLocale();
  const foods = useAppStore((state) => state.foods);
  const activePlan = useAppStore(selectActiveDailyPlan);
  const shoppingItems = useAppStore((state) => state.shoppingItems);
  const addFoodToShopping = useAppStore((state) => state.addFoodToShopping);
  const addShoppingNeeds = useAppStore((state) => state.addShoppingNeeds);
  const removeShoppingItem = useAppStore((state) => state.removeShoppingItem);
  const markShoppingItemBought = useAppStore((state) => state.markShoppingItemBought);
  const addReferenceFoodToMyFoods = useAppStore((state) => state.addReferenceFoodToMyFoods);
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [addedReference, setAddedReference] = useState<{ name: string; inStock: boolean }>();
  const [stockUpPage, setStockUpPage] = useState(0);
  const [discoverPage, setDiscoverPage] = useState(0);

  const shoppingKeys = useMemo(
    () => new Set(shoppingItems.map(shoppingIdentityKey)),
    [shoppingItems],
  );
  const planNeeded = useMemo(
    () => getPlanNeededFoods(activePlan, foods),
    [activePlan, foods],
  );
  const stockUpPool = useMemo(
    () => excludePlanNeededSuggestions(getBuyAgainSuggestions(foods), planNeeded).slice(0, 12),
    [foods, planNeeded],
  );
  const stockUp = getSuggestionBatch(stockUpPool, stockUpPage);
  const discoverPool = useMemo(
    () => getTrySomethingNewSuggestions(referenceFoods, foods, undefined, 12),
    [foods],
  );
  const discover = getSuggestionBatch(discoverPool, discoverPage);
  const manualOptions = foods.filter((food) => !shoppingKeys.has(shoppingIdentityKey({
    foodId: food.id,
    referenceFoodId: food.referenceFoodId,
    displayName: food.name,
  })));

  const addReference = (referenceFoodId: string, inStock: boolean) => {
    const added = addReferenceFoodToMyFoods(referenceFoodId, inStock);
    if (added) setAddedReference({ name: foodName(added), inStock });
  };

  const sourceLabels: Record<ShoppingItemSource, string> = {
    current_plan: t("shop.todayPlan"),
    recipe: t("shop.recipe"),
    saved_recipe: t("shop.savedRecipe"),
    manual: t("shop.manual"),
  };

  return (
    <div className="shop-page">
      <section className="shop-intro">
        <p className="section-kicker">{t("shop.introKicker")}</p>
        <h2>{t("shop.introTitle")}</h2>
        <p>{t("shop.introBody")}</p>
      </section>

      <section className="shop-section" aria-labelledby="shopping-list-title">
        <div className="shop-section__heading">
          <div><p className="section-kicker">{t("shop.list")}</p><h2 id="shopping-list-title">{t("shop.ready")}</h2></div>
          <span>{shoppingItems.length} {t(shoppingItems.length === 1 ? "common.item" : "common.items")}</span>
        </div>

        {shoppingItems.length === 0 ? (
          <div className="shopping-empty">
            <strong>{t("shop.emptyTitle")}</strong>
            <p>{t("shop.emptyBody")}</p>
          </div>
        ) : (
          <ul className="shopping-list">
            {shoppingItems.map((item) => {
              const currentFood = foods.find((food) => food.id === item.foodId)
                ?? (item.referenceFoodId ? foods.find((food) => food.referenceFoodId === item.referenceFoodId) : undefined);
              const referenceAvailable = Boolean(item.referenceFoodId
                && referenceFoods.some((reference) => reference.id === item.referenceFoodId));
              const canMarkBought = Boolean(currentFood || referenceAvailable);
              return (
                <li key={item.id}>
                  <div className="shopping-list__copy">
                    <strong>{getReferenceFoodDisplayName(item.referenceFoodId, item.displayName, locale)}</strong>
                    <span>{item.sources.length > 1 ? t("shop.neededPlaces", { count: item.sources.length }) : sourceLabels[item.sources[0]]}</span>
                    {!currentFood && !referenceAvailable && <small>{t("recipe.stockUnavailable")}</small>}
                  </div>
                  <div className="shopping-list__actions">
                    <button className="shop-buy-button" type="button" disabled={!canMarkBought} onClick={() => markShoppingItemBought(item.id)}>
                      {t(currentFood ? "shop.markBought" : referenceAvailable ? "shop.addMarkBought" : "common.unavailable")}
                    </button>
                    <button className="shop-remove-button" type="button" onClick={() => removeShoppingItem(item.id)} aria-label={t("shop.removeA11y", { name: getReferenceFoodDisplayName(item.referenceFoodId, item.displayName, locale) })}>{t("action.remove")}</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="manual-shopping-add">
          <button className="text-button" type="button" aria-expanded={manualOpen} onClick={() => setManualOpen((value) => !value)}>
            {t(manualOpen ? "action.close" : "shop.addFromFoods")}
          </button>
          {manualOpen && (
            <div>
              <label>
                <span className="sr-only">{t("shop.foodToAdd")}</span>
                <select value={selectedFoodId} onChange={(event) => setSelectedFoodId(event.target.value)}>
                  <option value="">{t("shop.chooseFood")}</option>
                  {manualOptions.map((food) => <option value={food.id} key={food.id}>{foodName(food)}</option>)}
                </select>
              </label>
              <button className="secondary-button" type="button" disabled={!selectedFoodId} onClick={() => {
                addFoodToShopping(selectedFoodId);
                setSelectedFoodId("");
              }}>{t("shop.addList")}</button>
            </div>
          )}
        </div>
      </section>

      <section className="shop-section" aria-labelledby="plan-needed-title">
        <div className="shop-section__heading">
          <div><h2 id="plan-needed-title">{t("shop.planNeeded")}</h2><p className="shop-section__description">{t("shop.planNeededDescription")}</p></div>
        </div>
        {!activePlan ? (
          <p className="shop-section__quiet">{t("shop.planNotGenerated")}</p>
        ) : planNeeded.length === 0 ? (
          <p className="shop-section__quiet">{t("shop.planAllStocked")}</p>
        ) : (
          <div className="shop-suggestions">
            {planNeeded.map((need) => {
              const food = foods.find((candidate) => candidate.id === need.foodId)!;
              const onList = shoppingKeys.has(shoppingIdentityKey(need));
              return (
                <article className="shop-suggestion" key={need.foodId}>
                  <div>
                    <h3>{foodName(food)}</h3>
                    <p>{need.mealTypes.map((mealType) => mealName(mealType, true)).join(" · ")}</p>
                    <small>{t("shop.currentPlanReason")}</small>
                  </div>
                  <button className="secondary-button" type="button" disabled={onList} onClick={() => addShoppingNeeds([need], "current_plan")}>
                    {t(onList ? "shop.onList" : "shop.addList")}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="shop-section" aria-labelledby="buy-again-title">
        <div className="shop-section__heading">
          <div><h2 id="buy-again-title">{t("shop.stockUp")}</h2><p className="shop-section__description">{t("shop.stockUpDescription")}</p></div>
          {stockUp.hasAnotherSet && <button className="shop-cycle-button" type="button" onClick={() => setStockUpPage(stockUp.page + 1)}>{t("shop.showAnother")}</button>}
        </div>
        {stockUp.items.length === 0 ? (
          <p className="shop-section__quiet">{t("shop.noStockUp")}</p>
        ) : (
          <div className="shop-suggestions">
            {stockUp.items.map((suggestion) => {
              const food = foods.find((candidate) => candidate.id === suggestion.foodId)!;
              const onList = shoppingKeys.has(shoppingIdentityKey({
                foodId: food.id,
                referenceFoodId: food.referenceFoodId,
                displayName: food.name,
              }));
              return (
                <article className="shop-suggestion" key={suggestion.foodId}>
                  <div>
                    <h3>{foodName(food)}</h3>
                    <p>{suggestion.mealTypes.map((mealType) => mealName(mealType, true)).join(" · ")}</p>
                    <small>{[
                      food.regularBuy ? t("shop.reasonRegular") : "",
                      food.favourite ? t("shop.reasonFavourite") : "",
                      suggestion.mealTypes.length > 1
                        ? t("shop.worksForMeals", { meals: list(suggestion.mealTypes.map((mealType) => mealName(mealType, true))) })
                        : t(suggestion.recipeCoverage === 1 ? "shop.usefulOne" : "shop.usefulMany", { count: suggestion.recipeCoverage }),
                    ].filter(Boolean).slice(0, 2).join(" · ")}</small>
                  </div>
                  <button className="secondary-button" type="button" disabled={onList} onClick={() => addFoodToShopping(suggestion.foodId)}>
                    {t(onList ? "shop.onList" : "shop.addList")}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="shop-section" aria-labelledby="try-new-title">
        <div className="shop-section__heading">
          <div><h2 id="try-new-title">{t("shop.discover")}</h2><p className="shop-section__description">{t("shop.discoverDescription")}</p></div>
          {discover.hasAnotherSet && <button className="shop-cycle-button" type="button" onClick={() => setDiscoverPage(discover.page + 1)}>{t("shop.showAnother")}</button>}
        </div>
        <div className="shop-suggestions">
          {discover.items.map((suggestion) => (
            <article className="shop-suggestion shop-suggestion--new" key={suggestion.referenceFoodId}>
              <div>
                <span className="shop-suggestion__category">{categoryName(suggestion.category)}</span>
                <h3>{referenceFoodName(referenceFoods.find((food) => food.id === suggestion.referenceFoodId)!)}</h3>
                <p>{suggestion.mealTypes.map((mealType) => mealName(mealType, true)).join(" · ")}</p>
                <small>{suggestion.compatibleTemplateNames.length
                  ? t("shop.worksWith", { names: list(suggestion.compatibleTemplateNames.slice(0, 3).map((name) => {
                    const template = recipeTemplates.find((candidate) => candidate.name === name);
                    return template ? getRecipeTemplateDisplayName(template.id, name, locale) : name;
                  })) })
                  : t("shop.addsOption", { category: categoryName(suggestion.category) })}</small>
              </div>
              <div className="shop-suggestion__actions">
                <button className="secondary-button" type="button" onClick={() => addReference(suggestion.referenceFoodId, false)}>{t("shop.addMyFoods")}</button>
                <button className="text-button" type="button" onClick={() => addReference(suggestion.referenceFoodId, true)}>{t("shop.addStock")}</button>
              </div>
            </article>
          ))}
        </div>
        <p className="shop-feedback" role="status" aria-live="polite">{addedReference
          ? t("shop.addedFeedback", { name: addedReference.name, stock: addedReference.inStock ? t("shop.addedStockSuffix") : "" })
          : ""}</p>
      </section>
    </div>
  );
}
