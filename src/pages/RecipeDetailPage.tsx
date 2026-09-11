import { useMemo, useState } from "react";
import { deriveGeneratedRecipe, recipeSnapshotKey } from "../engine/generatedRecipe";
import { getIngredientSwapCandidates } from "../engine/recipeSwap";
import { getGeneratedRecipeNeeds, getSavedRecipeNeeds, shoppingIdentityKey } from "../engine/shoppingEngine";
import { selectActiveDailyPlan, useAppStore } from "../stores/useAppStore";
import type {
  GeneratedRecipe,
  GeneratedRecipeIngredient,
  MealType,
  RecipeIngredientSnapshot,
  ServingUnit,
  ShoppingItemSource,
  ShoppingNeed,
} from "../types";

const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Evening snack",
};

const categoryLabels: Record<GeneratedRecipeIngredient["category"], string> = {
  protein: "Protein",
  carb: "Carb",
  vegetable: "Vegetable",
  fruit: "Fruit",
  fat_sauce: "Fat & sauce",
  composite: "Composite",
};

const unitLabel = (unit: ServingUnit): string => unit === "piece" ? "pc" : unit;
const amountLabel = (ingredient: RecipeIngredientSnapshot): string =>
  `${ingredient.amount}${unitLabel(ingredient.unit)}`;
const equipmentLabel = (equipment: string[]): string =>
  equipment.length ? equipment.map((item) => item[0].toUpperCase() + item.slice(1)).join(" · ") : "No special equipment";

function RecipeNutrition({ recipe }: { recipe: Pick<GeneratedRecipe, "nutrition" | "fibreDataComplete"> }) {
  const fibre = Math.round(recipe.nutrition.fibre ?? 0);
  return (
    <section className="recipe-nutrition" aria-label="Recipe nutrition">
      <div><span>Calories</span><strong>{Math.round(recipe.nutrition.calories)} <small>kcal</small></strong></div>
      <div><span>Protein</span><strong>{Math.round(recipe.nutrition.protein)}<small>g</small></strong></div>
      <div>
        <span>Fibre</span>
        <strong>{recipe.fibreDataComplete ? fibre : `≥${fibre}`}<small>g</small></strong>
        {!recipe.fibreDataComplete && <small>Known AOAC fibre only</small>}
      </div>
    </section>
  );
}

function RecipeMethod({ instructions }: { instructions: string[] }) {
  return (
    <section className="recipe-section">
      <p className="section-kicker">Method</p>
      <ol className="recipe-method">
        {instructions.map((instruction, index) => <li key={`${index}-${instruction}`}>{instruction}</li>)}
      </ol>
    </section>
  );
}

function RecipeNeeds({ needs, source }: { needs: ShoppingNeed[]; source: ShoppingItemSource }) {
  const shoppingItems = useAppStore((state) => state.shoppingItems);
  const addShoppingNeeds = useAppStore((state) => state.addShoppingNeeds);
  const [isOpen, setIsOpen] = useState(false);
  const allAdded = needs.length > 0 && needs.every((need) =>
    shoppingItems.some((item) => shoppingIdentityKey(item) === shoppingIdentityKey(need)));

  return (
    <section className={`recipe-needs${isOpen ? " is-open" : ""}`}>
      <button
        className="recipe-needs__trigger"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span><strong>What do I need?</strong><small>Check this recipe against what’s in stock.</small></span>
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="recipe-needs__body">
          {needs.length === 0 ? (
            <p className="recipe-needs__complete">You have everything you need.</p>
          ) : (
            <>
              <p className="section-kicker">You need</p>
              <ul>
                {needs.map((need) => (
                  <li key={shoppingIdentityKey(need)}>
                    <span><strong>{need.displayName}</strong>{need.status === "stock_status_unavailable" && <small>Stock status unavailable</small>}</span>
                    {need.amount !== undefined && need.unit && <span>{need.amount}{unitLabel(need.unit)}</span>}
                  </li>
                ))}
              </ul>
              <button
                className={allAdded ? "secondary-button" : "primary-button"}
                type="button"
                disabled={allAdded}
                onClick={() => addShoppingNeeds(needs, source)}
              >
                {allAdded ? "Added to Shopping List" : "Add Missing to Shopping List"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function RecipeDetailPage({ mealType, onBack }: { mealType?: MealType; onBack: () => void }) {
  const foods = useAppStore((state) => state.foods);
  const dailyPlan = useAppStore(selectActiveDailyPlan);
  const activePlanningMode = useAppStore((state) => state.activePlanningMode);
  const savedRecipes = useAppStore((state) => state.savedRecipes);
  const swapMealItem = useAppStore((state) => state.swapMealItem);
  const saveRecipe = useAppStore((state) => state.saveRecipe);
  const [swapFoodId, setSwapFoodId] = useState<string>();
  const meal = mealType && dailyPlan ? dailyPlan[mealType] : undefined;
  const recipe = useMemo(() => meal ? deriveGeneratedRecipe(meal, foods) : undefined, [meal, foods]);
  const shoppingNeeds = useMemo(() => recipe ? getGeneratedRecipeNeeds(recipe, foods) : [], [recipe, foods]);
  const isSaved = recipe
    ? savedRecipes.some((saved) => recipeSnapshotKey(saved) === recipeSnapshotKey(recipe))
    : false;

  if (!meal || !recipe) {
    return (
      <section className="empty-state">
        <span aria-hidden="true">○</span>
        <h2>This recipe is no longer available</h2>
        <p>Return to Today and open a meal from the current plan.</p>
        <button className="primary-button" type="button" onClick={onBack}>Back to Today</button>
      </section>
    );
  }

  const swapCandidates = swapFoodId
    ? getIngredientSwapCandidates({
      meal,
      foods,
      targetFoodId: swapFoodId,
      planningMode: activePlanningMode,
    })
    : [];

  const handleSwap = (replacementFoodId: string) => {
    if (swapFoodId && swapMealItem(meal.type, swapFoodId, replacementFoodId)) {
      setSwapFoodId(undefined);
    }
  };

  return (
    <article className="recipe-detail">
      <header className="recipe-hero">
        <p className="section-kicker">{mealLabels[recipe.mealType]} recipe</p>
        <h2>{recipe.name}</h2>
        <p>{recipe.cookingTime} min · {equipmentLabel(recipe.equipment)}</p>
      </header>

      <RecipeNutrition recipe={recipe} />

      <section className="recipe-section">
        <div className="recipe-section__heading">
          <p className="section-kicker">Ingredients</p>
          <span>{recipe.ingredients.length} items</span>
        </div>
        <ul className="recipe-ingredients">
          {recipe.ingredients.map((ingredient) => {
            const canSwap = Boolean(ingredient.slotId) && !ingredient.locked;
            const isOpen = swapFoodId === ingredient.foodId;
            return (
              <li key={ingredient.foodId} className={isOpen ? "is-open" : ""}>
                <div className="recipe-ingredient-row">
                  <div>
                    <strong>{ingredient.foodName}</strong>
                    <span>{categoryLabels[ingredient.category]}{ingredient.inStock ? " · In Stock" : ""}</span>
                  </div>
                  <span>{amountLabel(ingredient)}</span>
                  <button
                    className="recipe-swap-button"
                    type="button"
                    disabled={!canSwap}
                    aria-expanded={canSwap ? isOpen : undefined}
                    onClick={() => setSwapFoodId(isOpen ? undefined : ingredient.foodId)}
                  >
                    {ingredient.locked ? "Locked" : "Swap"}
                  </button>
                </div>
                {ingredient.locked && <small className="recipe-locked-note">Unlock this ingredient to swap it.</small>}
                {isOpen && (
                  <div className="swap-panel" role="region" aria-label={`Swap ${ingredient.foodName}`}>
                    <p>Swap {ingredient.foodName}</p>
                    {swapCandidates.length ? (
                      <div className="swap-options">
                        {swapCandidates.map((candidate) => (
                          <button type="button" key={candidate.id} onClick={() => handleSwap(candidate.id)}>
                            <span>{candidate.name}</span>
                            <small>{categoryLabels[candidate.category]}{candidate.inStock ? " · In Stock" : ""}</small>
                          </button>
                        ))}
                      </div>
                    ) : <span className="swap-empty">No compatible foods are available in My Foods.</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <RecipeNeeds needs={shoppingNeeds} source="recipe" />

      <RecipeMethod instructions={recipe.instructions} />

      <footer className="recipe-save-bar" aria-live="polite">
        <div><strong>{isSaved ? "Saved to My Recipes" : "Keep this combination"}</strong><span>{isSaved ? "This exact recipe snapshot is saved." : "Save the ingredients, amounts and method as they are now."}</span></div>
        <button className={isSaved ? "secondary-button" : "primary-button"} type="button" disabled={isSaved} onClick={() => saveRecipe(recipe)}>
          {isSaved ? "Saved" : "Save Recipe"}
        </button>
      </footer>
    </article>
  );
}

export function SavedRecipeDetailPage({ recipeId, onDeleted }: { recipeId?: string; onDeleted: () => void }) {
  const recipe = useAppStore((state) => state.savedRecipes.find((candidate) => candidate.id === recipeId));
  const foods = useAppStore((state) => state.foods);
  const deleteSavedRecipe = useAppStore((state) => state.deleteSavedRecipe);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const shoppingNeeds = useMemo(() => recipe ? getSavedRecipeNeeds(recipe, foods) : [], [recipe, foods]);

  if (!recipe) {
    return (
      <section className="empty-state">
        <span aria-hidden="true">○</span>
        <h2>Saved recipe not found</h2>
        <p>It may already have been removed from My Recipes.</p>
        <button className="primary-button" type="button" onClick={onDeleted}>Back to Recipes</button>
      </section>
    );
  }

  const handleDelete = () => {
    deleteSavedRecipe(recipe.id);
    onDeleted();
  };

  return (
    <article className="recipe-detail">
      <header className="recipe-hero">
        <p className="section-kicker">Saved {mealLabels[recipe.mealType]} recipe</p>
        <h2>{recipe.name}</h2>
        <p>{recipe.cookingTime} min · {equipmentLabel(recipe.equipment)}</p>
      </header>

      <RecipeNutrition recipe={recipe} />

      <section className="recipe-section">
        <div className="recipe-section__heading">
          <p className="section-kicker">Ingredients</p>
          <span>{recipe.ingredients.length} items</span>
        </div>
        <ul className="saved-recipe-ingredients">
          {recipe.ingredients.map((ingredient) => (
            <li key={`${ingredient.foodId}-${ingredient.amount}-${ingredient.unit}`}>
              <strong>{ingredient.foodName}</strong><span>{amountLabel(ingredient)}</span>
            </li>
          ))}
        </ul>
      </section>

      <RecipeNeeds needs={shoppingNeeds} source="saved_recipe" />

      <RecipeMethod instructions={recipe.instructions} />

      <section className="saved-recipe-actions">
        {!confirmingDelete ? (
          <button className="danger-button" type="button" onClick={() => setConfirmingDelete(true)}>Delete Saved Recipe</button>
        ) : (
          <div className="delete-confirmation" role="alert">
            <div><strong>Delete this saved recipe?</strong><span>This removes only this snapshot from My Recipes.</span></div>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              <button className="danger-button" type="button" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
