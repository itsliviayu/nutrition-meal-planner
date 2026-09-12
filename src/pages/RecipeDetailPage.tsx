import { useMemo, useState } from "react";
import { deriveGeneratedRecipe, deriveSavedRecipeDisplay, recipeSnapshotKey } from "../engine/generatedRecipe";
import { getIngredientSwapCandidates } from "../engine/recipeSwap";
import { getGeneratedRecipeNeeds, getSavedRecipeNeeds, shoppingIdentityKey } from "../engine/shoppingEngine";
import { selectActiveDailyPlan, useAppStore } from "../stores/useAppStore";
import { getReferenceFoodDisplayName } from "../i18n/locale";
import { useLocale } from "../i18n/useLocale";
import type {
  GeneratedRecipe,
  MealType,
  RecipeIngredientSnapshot,
  ServingUnit,
  ShoppingItemSource,
  ShoppingNeed,
} from "../types";

const unitLabel = (unit: ServingUnit, pieceLabel: string): string => unit === "piece" ? pieceLabel : unit;
const amountLabel = (ingredient: RecipeIngredientSnapshot, pieceLabel: string): string =>
  `${ingredient.amount}${unitLabel(ingredient.unit, pieceLabel)}`;
function RecipeNutrition({ recipe }: { recipe: Pick<GeneratedRecipe, "nutrition" | "fibreDataComplete"> }) {
  const { locale, t } = useLocale();
  const fibre = Math.round(recipe.nutrition.fibre ?? 0);
  return (
    <section className="recipe-nutrition" aria-label={t("recipe.nutrition")}>
      <div><span>{t("nutrition.calories")}</span><strong>{Math.round(recipe.nutrition.calories)} <small>kcal</small></strong></div>
      <div><span>{t("nutrition.protein")}</span><strong>{Math.round(recipe.nutrition.protein)}<small>g</small></strong></div>
      <div>
        <span>{t("nutrition.fibre")}</span>
        <strong>{recipe.fibreDataComplete ? fibre : `≥${fibre}`}<small>g</small></strong>
        {!recipe.fibreDataComplete && <small>{t(locale === "zh-CN" ? "nutrition.partialDetail" : "nutrition.knownAoacOnly")}</small>}
      </div>
    </section>
  );
}

function RecipeMethod({ instructions }: { instructions: string[] }) {
  const { t } = useLocale();
  return (
    <section className="recipe-section">
      <p className="section-kicker">{t("recipe.method")}</p>
      <ol className="recipe-method">
        {instructions.map((instruction, index) => <li key={`${index}-${instruction}`}>{instruction}</li>)}
      </ol>
    </section>
  );
}

function RecipeNeeds({ needs, source }: { needs: ShoppingNeed[]; source: ShoppingItemSource }) {
  const { locale, t } = useLocale();
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
        <span><strong>{t("recipe.whatNeed")}</strong><small>{t("recipe.checkStock")}</small></span>
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="recipe-needs__body">
          {needs.length === 0 ? (
            <p className="recipe-needs__complete">{t("recipe.everything")}</p>
          ) : (
            <>
              <p className="section-kicker">{t("recipe.youNeed")}</p>
              <ul>
                {needs.map((need) => (
                  <li key={shoppingIdentityKey(need)}>
                    <span><strong>{getReferenceFoodDisplayName(need.referenceFoodId, need.displayName, locale)}</strong>{need.status === "stock_status_unavailable" && <small>{t("recipe.stockUnavailable")}</small>}</span>
                    {need.amount !== undefined && need.unit && <span>{need.amount}{unitLabel(need.unit, t("common.pieceShort"))}</span>}
                  </li>
                ))}
              </ul>
              <button
                className={allAdded ? "secondary-button" : "primary-button"}
                type="button"
                disabled={allAdded}
                onClick={() => addShoppingNeeds(needs, source)}
              >
                {t(allAdded ? "recipe.addedShopping" : "recipe.addMissing")}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function RecipeDetailPage({ mealType, onBack }: { mealType?: MealType; onBack: () => void }) {
  const { categoryName, equipmentName, foodName, locale, mealName, t } = useLocale();
  const foods = useAppStore((state) => state.foods);
  const dailyPlan = useAppStore(selectActiveDailyPlan);
  const activePlanningMode = useAppStore((state) => state.activePlanningMode);
  const savedRecipes = useAppStore((state) => state.savedRecipes);
  const swapMealItem = useAppStore((state) => state.swapMealItem);
  const saveRecipe = useAppStore((state) => state.saveRecipe);
  const [swapFoodId, setSwapFoodId] = useState<string>();
  const meal = mealType && dailyPlan ? dailyPlan[mealType] : undefined;
  const recipe = useMemo(() => meal ? deriveGeneratedRecipe(meal, foods, undefined, locale) : undefined, [locale, meal, foods]);
  const shoppingNeeds = useMemo(() => recipe ? getGeneratedRecipeNeeds(recipe, foods) : [], [recipe, foods]);
  const isSaved = recipe
    ? savedRecipes.some((saved) => recipeSnapshotKey(saved) === recipeSnapshotKey(recipe))
    : false;

  if (!meal || !recipe) {
    return (
      <section className="empty-state">
        <span aria-hidden="true">○</span>
        <h2>{t("recipe.unavailableTitle")}</h2>
        <p>{t("recipe.unavailableBody")}</p>
        <button className="primary-button" type="button" onClick={onBack}>{t("recipe.backToday")}</button>
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
        <p className="section-kicker">{t("recipe.mealRecipe", { meal: mealName(recipe.mealType) })}</p>
        <h2>{recipe.name}</h2>
        <p>{recipe.cookingTime} {t("common.minutes")} · {recipe.equipment.length ? recipe.equipment.map(equipmentName).join(" · ") : t("equipment.none")}</p>
      </header>

      <RecipeNutrition recipe={recipe} />

      <section className="recipe-section">
        <div className="recipe-section__heading">
          <p className="section-kicker">{t("recipe.ingredients")}</p>
          <span>{recipe.ingredients.length} {t(recipe.ingredients.length === 1 ? "common.item" : "common.items")}</span>
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
                    <span>{categoryName(ingredient.category)}{ingredient.inStock ? ` · ${t("common.inStock")}` : ""}</span>
                  </div>
                  <span>{amountLabel(ingredient, t("common.pieceShort"))}</span>
                  <button
                    className="recipe-swap-button"
                    type="button"
                    disabled={!canSwap}
                    aria-expanded={canSwap ? isOpen : undefined}
                    onClick={() => setSwapFoodId(isOpen ? undefined : ingredient.foodId)}
                  >
                    {t(ingredient.locked ? "meal.locked" : "recipe.swap")}
                  </button>
                </div>
                {ingredient.locked && <small className="recipe-locked-note">{t("recipe.unlockToSwap")}</small>}
                {isOpen && (
                  <div className="swap-panel" role="region" aria-label={t("recipe.swapName", { name: ingredient.foodName })}>
                    <p>{t("recipe.swapName", { name: ingredient.foodName })}</p>
                    {swapCandidates.length ? (
                      <div className="swap-options">
                        {swapCandidates.map((candidate) => (
                          <button type="button" key={candidate.id} onClick={() => handleSwap(candidate.id)}>
                            <span>{foodName(candidate)}</span>
                            <small>{categoryName(candidate.category)}{candidate.inStock ? ` · ${t("common.inStock")}` : ""}</small>
                          </button>
                        ))}
                      </div>
                    ) : <span className="swap-empty">{t("recipe.noSwap")}</span>}
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
        <div><strong>{t(isSaved ? "recipe.savedToRecipes" : "recipe.keepCombination")}</strong><span>{t(isSaved ? "recipe.snapshotSaved" : "recipe.saveDescription")}</span></div>
        <button className={isSaved ? "secondary-button" : "primary-button"} type="button" disabled={isSaved} onClick={() => saveRecipe(deriveGeneratedRecipe(meal, foods))}>
          {t(isSaved ? "common.saved" : "recipe.save")}
        </button>
      </footer>
    </article>
  );
}

export function SavedRecipeDetailPage({ recipeId, onDeleted }: { recipeId?: string; onDeleted: () => void }) {
  const { equipmentName, locale, mealName, t } = useLocale();
  const recipe = useAppStore((state) => state.savedRecipes.find((candidate) => candidate.id === recipeId));
  const foods = useAppStore((state) => state.foods);
  const deleteSavedRecipe = useAppStore((state) => state.deleteSavedRecipe);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const shoppingNeeds = useMemo(() => recipe ? getSavedRecipeNeeds(recipe, foods) : [], [recipe, foods]);
  const display = useMemo(() => recipe ? deriveSavedRecipeDisplay(recipe, foods, locale) : undefined, [foods, locale, recipe]);

  if (!recipe) {
    return (
      <section className="empty-state">
        <span aria-hidden="true">○</span>
        <h2>{t("recipe.savedNotFound")}</h2>
        <p>{t("recipe.savedNotFoundBody")}</p>
        <button className="primary-button" type="button" onClick={onDeleted}>{t("recipe.backRecipes")}</button>
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
        <p className="section-kicker">{t("recipe.savedMealRecipe", { meal: mealName(recipe.mealType) })}</p>
        <h2>{display?.name ?? recipe.name}</h2>
        <p>{recipe.cookingTime} {t("common.minutes")} · {recipe.equipment.length ? recipe.equipment.map(equipmentName).join(" · ") : t("equipment.none")}</p>
      </header>

      <RecipeNutrition recipe={recipe} />

      <section className="recipe-section">
        <div className="recipe-section__heading">
          <p className="section-kicker">{t("recipe.ingredients")}</p>
          <span>{recipe.ingredients.length} {t(recipe.ingredients.length === 1 ? "common.item" : "common.items")}</span>
        </div>
        <ul className="saved-recipe-ingredients">
          {recipe.ingredients.map((ingredient) => (
            <li key={`${ingredient.foodId}-${ingredient.amount}-${ingredient.unit}`}>
              <strong>{getReferenceFoodDisplayName(ingredient.referenceFoodId, ingredient.foodName, locale)}</strong><span>{amountLabel(ingredient, t("common.pieceShort"))}</span>
            </li>
          ))}
        </ul>
      </section>

      <RecipeNeeds needs={shoppingNeeds} source="saved_recipe" />

      <RecipeMethod instructions={display?.instructions ?? recipe.instructions} />

      <section className="saved-recipe-actions">
        {!confirmingDelete ? (
          <button className="danger-button" type="button" onClick={() => setConfirmingDelete(true)}>{t("recipe.deleteSaved")}</button>
        ) : (
          <div className="delete-confirmation" role="alert">
            <div><strong>{t("recipe.deleteConfirm")}</strong><span>{t("recipe.deleteBody")}</span></div>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmingDelete(false)}>{t("action.cancel")}</button>
              <button className="danger-button" type="button" onClick={handleDelete}>{t("action.delete")}</button>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
