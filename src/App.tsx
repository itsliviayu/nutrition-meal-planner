import { useState } from "react";
import { AppShell, type AppRoute } from "./components/AppShell";
import { AddFoodPage } from "./pages/AddFoodPage";
import { ConfirmCommonFoodPage } from "./pages/ConfirmCommonFoodPage";
import { FoodFormPage } from "./pages/FoodFormPage";
import { FoodsPage } from "./pages/FoodsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RecipeDetailPage, SavedRecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipesPage } from "./pages/RecipesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayPage } from "./pages/TodayPage";
import type { MealType } from "./types";

const titles: Record<AppRoute, string> = {
  today: "Today",
  foods: "Food Library",
  recipes: "Recipes",
  shop: "Shop",
  settings: "Settings",
  "add-food": "Add Food",
  "confirm-food": "Add Food",
  "custom-food": "Custom Food",
  "edit-food": "Edit Food",
  "recipe-detail": "Recipe",
  "saved-recipe-detail": "Saved Recipe",
};

const eyebrows: Partial<Record<AppRoute, string>> = {
  foods: "Your ingredients",
  settings: "Your preferences",
  "add-food": "Food Library",
  "confirm-food": "Quick add",
  "custom-food": "Package or estimate",
  "edit-food": "Food Library",
  "recipe-detail": "Today",
  "saved-recipe-detail": "My Recipes",
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>("today");
  const [settingsReturnRoute, setSettingsReturnRoute] = useState<AppRoute>("today");
  const [editingFoodId, setEditingFoodId] = useState<string>();
  const [selectedReferenceFoodId, setSelectedReferenceFoodId] = useState<string>();
  const [selectedMealType, setSelectedMealType] = useState<MealType>();
  const [selectedSavedRecipeId, setSelectedSavedRecipeId] = useState<string>();

  const navigate = (nextRoute: AppRoute) => {
    if (nextRoute === "settings" && ["today", "foods", "recipes", "shop"].includes(route)) {
      setSettingsReturnRoute(route);
    }
    if (nextRoute !== "edit-food") setEditingFoodId(undefined);
    if (nextRoute !== "confirm-food") setSelectedReferenceFoodId(undefined);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  let content;
  if (route === "today") {
    content = <TodayPage onOpenFoods={() => navigate("foods")} onOpenRecipe={(mealType) => { setSelectedMealType(mealType); navigate("recipe-detail"); }} />;
  } else if (route === "foods") {
    content = <FoodsPage onAdd={() => navigate("add-food")} onEdit={(id) => { setEditingFoodId(id); setRoute("edit-food"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />;
  } else if (route === "add-food") {
    content = (
      <AddFoodPage
        onSelectReference={(id) => { setSelectedReferenceFoodId(id); setRoute("confirm-food"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onAddCustom={() => navigate("custom-food")}
        onViewExisting={(id) => { setEditingFoodId(id); setRoute("edit-food"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onMultiAddComplete={() => navigate("foods")}
      />
    );
  } else if (route === "confirm-food") {
    content = <ConfirmCommonFoodPage referenceFoodId={selectedReferenceFoodId} onDone={() => navigate("foods")} onBack={() => navigate("add-food")} />;
  } else if (route === "custom-food" || route === "edit-food") {
    content = <FoodFormPage foodId={route === "edit-food" ? editingFoodId : undefined} onDone={() => navigate("foods")} onCancel={route === "custom-food" ? () => navigate("add-food") : undefined} />;
  } else if (route === "settings") {
    content = <SettingsPage onDone={() => navigate(settingsReturnRoute)} />;
  } else if (route === "recipe-detail") {
    content = <RecipeDetailPage mealType={selectedMealType} onBack={() => navigate("today")} />;
  } else if (route === "recipes") {
    content = <RecipesPage onOpenRecipe={(id) => { setSelectedSavedRecipeId(id); navigate("saved-recipe-detail"); }} />;
  } else if (route === "saved-recipe-detail") {
    content = <SavedRecipeDetailPage recipeId={selectedSavedRecipeId} onDeleted={() => navigate("recipes")} />;
  } else {
    content = <PlaceholderPage kind={route} onOpenFoods={() => navigate("foods")} />;
  }

  const detailPage = route === "add-food" || route === "confirm-food" || route === "custom-food" || route === "edit-food" || route === "settings" || route === "recipe-detail" || route === "saved-recipe-detail";
  const goBack = route === "confirm-food" || route === "custom-food"
    ? () => navigate("add-food")
    : route === "recipe-detail" ? () => navigate("today")
      : route === "saved-recipe-detail" ? () => navigate("recipes")
    : route === "settings" ? () => navigate(settingsReturnRoute) : () => navigate("foods");

  return (
    <AppShell
      route={route}
      title={titles[route]}
      eyebrow={eyebrows[route]}
      onNavigate={navigate}
      showBack={detailPage}
      onBack={goBack}
    >
      {content}
    </AppShell>
  );
}
