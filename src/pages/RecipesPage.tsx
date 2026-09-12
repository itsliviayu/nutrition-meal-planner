import { useAppStore } from "../stores/useAppStore";
import { deriveSavedRecipeDisplay } from "../engine/generatedRecipe";
import { getReferenceFoodDisplayName } from "../i18n/locale";
import { useLocale } from "../i18n/useLocale";

export function RecipesPage({ onOpenRecipe }: { onOpenRecipe: (id: string) => void }) {
  const { locale, mealName, t } = useLocale();
  const savedRecipes = useAppStore((state) => state.savedRecipes);
  const foods = useAppStore((state) => state.foods);

  return (
    <div className="recipes-page">
      <section className="recipes-intro">
        <div><p className="section-kicker">{t("recipes.myRecipes")}</p><h2>{t("recipes.heading")}</h2></div>
        <span>{t("recipes.savedCount", { count: savedRecipes.length })}</span>
      </section>

      {savedRecipes.length === 0 ? (
        <section className="empty-state recipes-empty">
          <span aria-hidden="true">⌁</span>
          <h2>{t("recipes.emptyTitle")}</h2>
          <p>{t("recipes.emptyBody")}</p>
        </section>
      ) : (
        <section className="saved-recipe-list" aria-label={t("recipes.savedA11y")}>
          {savedRecipes.map((recipe) => {
            const display = deriveSavedRecipeDisplay(recipe, foods, locale);
            return (
            <button className="saved-recipe-card" type="button" key={recipe.id} onClick={() => onOpenRecipe(recipe.id)}>
              <span className="saved-recipe-card__type">{mealName(recipe.mealType)}</span>
              <h2>{display.name}</h2>
              <p>{recipe.ingredients.slice(0, 3).map((ingredient) => getReferenceFoodDisplayName(ingredient.referenceFoodId, ingredient.foodName, locale)).join(" · ")}</p>
              <div>
                <span>{recipe.cookingTime} {t("common.minutes")}</span>
                <span>{Math.round(recipe.nutrition.calories)} kcal</span>
                <span>{Math.round(recipe.nutrition.protein)}g {t("nutrition.protein")}</span>
              </div>
            </button>
          );})}
        </section>
      )}
    </div>
  );
}
