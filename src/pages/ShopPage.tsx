import { useMemo, useState } from "react";
import { referenceFoods } from "../data/seedFoods";
import {
  getBuyAgainSuggestions,
  getTrySomethingNewSuggestions,
  shoppingIdentityKey,
} from "../engine/shoppingEngine";
import { useAppStore } from "../stores/useAppStore";
import type { FoodCategory, MealType, ShoppingItemSource } from "../types";

const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
};

const categoryLabels: Record<FoodCategory, string> = {
  protein: "Protein",
  carb: "Carb",
  vegetable: "Vegetable",
  fruit: "Fruit",
  fat_sauce: "Fat & sauce",
  composite: "Composite",
};

const sourceLabels: Record<ShoppingItemSource, string> = {
  current_plan: "Today’s plan",
  recipe: "Recipe",
  saved_recipe: "Saved recipe",
  manual: "Added manually",
};

export function ShopPage() {
  const foods = useAppStore((state) => state.foods);
  const freePlan = useAppStore((state) => state.dailyPlans.free);
  const shoppingItems = useAppStore((state) => state.shoppingItems);
  const addFoodToShopping = useAppStore((state) => state.addFoodToShopping);
  const removeShoppingItem = useAppStore((state) => state.removeShoppingItem);
  const markShoppingItemBought = useAppStore((state) => state.markShoppingItemBought);
  const addReferenceFoodToMyFoods = useAppStore((state) => state.addReferenceFoodToMyFoods);
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [addedReferenceName, setAddedReferenceName] = useState<string>();

  const shoppingKeys = useMemo(
    () => new Set(shoppingItems.map(shoppingIdentityKey)),
    [shoppingItems],
  );
  const buyAgain = useMemo(
    () => getBuyAgainSuggestions(foods, freePlan).slice(0, 4),
    [foods, freePlan],
  );
  const trySomethingNew = useMemo(
    () => getTrySomethingNewSuggestions(referenceFoods, foods),
    [foods],
  );
  const manualOptions = foods.filter((food) => !shoppingKeys.has(shoppingIdentityKey({
    foodId: food.id,
    referenceFoodId: food.referenceFoodId,
    displayName: food.name,
  })));

  const addReference = (referenceFoodId: string, inStock: boolean) => {
    const added = addReferenceFoodToMyFoods(referenceFoodId, inStock);
    if (added) setAddedReferenceName(`${added.name} was added to My Foods${inStock ? " and marked In Stock" : ""}.`);
  };

  return (
    <div className="shop-page">
      <section className="shop-intro">
        <p className="section-kicker">Plan the next shop</p>
        <h2>Buy what helps, skip what doesn’t</h2>
        <p>Your list stays simple: foods to pick up, without guessed quantities.</p>
      </section>

      <section className="shop-section" aria-labelledby="shopping-list-title">
        <div className="shop-section__heading">
          <div><p className="section-kicker">Shopping List</p><h2 id="shopping-list-title">Ready for the shop</h2></div>
          <span>{shoppingItems.length} {shoppingItems.length === 1 ? "item" : "items"}</span>
        </div>

        {shoppingItems.length === 0 ? (
          <div className="shopping-empty">
            <strong>Nothing on your list yet.</strong>
            <p>Add missing ingredients from a recipe, or choose something from the suggestions below.</p>
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
                    <strong>{item.displayName}</strong>
                    <span>{item.sources.length > 1 ? `Needed from ${item.sources.length} places` : sourceLabels[item.sources[0]]}</span>
                    {!currentFood && !referenceAvailable && <small>Stock status unavailable</small>}
                  </div>
                  <div className="shopping-list__actions">
                    <button className="shop-buy-button" type="button" disabled={!canMarkBought} onClick={() => markShoppingItemBought(item.id)}>
                      {currentFood ? "Mark as Bought" : referenceAvailable ? "Add & Mark Bought" : "Unavailable"}
                    </button>
                    <button className="shop-remove-button" type="button" onClick={() => removeShoppingItem(item.id)} aria-label={`Remove ${item.displayName} from Shopping List`}>Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="manual-shopping-add">
          <button className="text-button" type="button" aria-expanded={manualOpen} onClick={() => setManualOpen((value) => !value)}>
            {manualOpen ? "Close" : "Add from My Foods"}
          </button>
          {manualOpen && (
            <div>
              <label>
                <span className="sr-only">Food to add</span>
                <select value={selectedFoodId} onChange={(event) => setSelectedFoodId(event.target.value)}>
                  <option value="">Choose a food</option>
                  {manualOptions.map((food) => <option value={food.id} key={food.id}>{food.name}</option>)}
                </select>
              </label>
              <button className="secondary-button" type="button" disabled={!selectedFoodId} onClick={() => {
                addFoodToShopping(selectedFoodId);
                setSelectedFoodId("");
              }}>Add to List</button>
            </div>
          )}
        </div>
      </section>

      <section className="shop-section" aria-labelledby="buy-again-title">
        <div className="shop-section__heading">
          <div><p className="section-kicker">Buy Again</p><h2 id="buy-again-title">Useful favourites to restock</h2></div>
        </div>
        {buyAgain.length === 0 ? (
          <p className="shop-section__quiet">Every food in My Foods is currently marked In Stock.</p>
        ) : (
          <div className="shop-suggestions">
            {buyAgain.map((suggestion) => {
              const food = foods.find((candidate) => candidate.id === suggestion.foodId)!;
              const onList = shoppingKeys.has(shoppingIdentityKey({
                foodId: food.id,
                referenceFoodId: food.referenceFoodId,
                displayName: food.name,
              }));
              return (
                <article className="shop-suggestion" key={suggestion.foodId}>
                  <div>
                    <h3>{suggestion.name}</h3>
                    <p>{suggestion.mealTypes.map((mealType) => mealLabels[mealType]).join(" · ")}</p>
                    <small>{suggestion.neededByCurrentPlan
                      ? "Needed by your current Plan Freely day"
                      : `Useful across ${suggestion.recipeCoverage} recipe ${suggestion.recipeCoverage === 1 ? "template" : "templates"}`}</small>
                  </div>
                  <button className="secondary-button" type="button" disabled={onList} onClick={() => addFoodToShopping(suggestion.foodId)}>
                    {onList ? "On List" : "Add to List"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="shop-section" aria-labelledby="try-new-title">
        <div className="shop-section__heading">
          <div><p className="section-kicker">Try Something New</p><h2 id="try-new-title">A few flexible additions</h2></div>
        </div>
        <div className="shop-suggestions">
          {trySomethingNew.map((suggestion) => (
            <article className="shop-suggestion shop-suggestion--new" key={suggestion.referenceFoodId}>
              <div>
                <span className="shop-suggestion__category">{categoryLabels[suggestion.category]}</span>
                <h3>{suggestion.name}</h3>
                <p>{suggestion.mealTypes.map((mealType) => mealLabels[mealType]).join(" · ")}</p>
                <small>{suggestion.compatibleTemplateNames.length
                  ? `Works with ${suggestion.compatibleTemplateNames.slice(0, 3).join(", ")}`
                  : `Adds another ${categoryLabels[suggestion.category].toLocaleLowerCase("en-GB")} option`}</small>
              </div>
              <div className="shop-suggestion__actions">
                <button className="secondary-button" type="button" onClick={() => addReference(suggestion.referenceFoodId, false)}>Add to My Foods</button>
                <button className="text-button" type="button" onClick={() => addReference(suggestion.referenceFoodId, true)}>Add & Mark In Stock</button>
              </div>
            </article>
          ))}
        </div>
        <p className="shop-feedback" role="status" aria-live="polite">{addedReferenceName}</p>
      </section>
    </div>
  );
}
