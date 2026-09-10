import { useAppStore } from "../stores/useAppStore";
import type { MealType } from "../types";

const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Evening snack",
};

export function RecipesPage({ onOpenRecipe }: { onOpenRecipe: (id: string) => void }) {
  const savedRecipes = useAppStore((state) => state.savedRecipes);

  return (
    <div className="recipes-page">
      <section className="recipes-intro">
        <div><p className="section-kicker">My Recipes</p><h2>Meals worth keeping</h2></div>
        <span>{savedRecipes.length} saved</span>
      </section>

      {savedRecipes.length === 0 ? (
        <section className="empty-state recipes-empty">
          <span aria-hidden="true">⌁</span>
          <h2>No saved recipes yet</h2>
          <p>Save a meal you like from Today and it will appear here.</p>
        </section>
      ) : (
        <section className="saved-recipe-list" aria-label="Saved recipes">
          {savedRecipes.map((recipe) => (
            <button className="saved-recipe-card" type="button" key={recipe.id} onClick={() => onOpenRecipe(recipe.id)}>
              <span className="saved-recipe-card__type">{mealLabels[recipe.mealType]}</span>
              <h2>{recipe.name}</h2>
              <p>{recipe.ingredients.slice(0, 3).map((ingredient) => ingredient.foodName).join(" · ")}</p>
              <div>
                <span>{recipe.cookingTime} min</span>
                <span>{Math.round(recipe.nutrition.calories)} kcal</span>
                <span>{Math.round(recipe.nutrition.protein)}g protein</span>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
