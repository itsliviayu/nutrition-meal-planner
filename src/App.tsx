import { useEffect, useState } from "react";
import { AppShell, type AppRoute } from "./components/AppShell";
import { AddFoodPage } from "./pages/AddFoodPage";
import { ConfirmCommonFoodPage } from "./pages/ConfirmCommonFoodPage";
import { FoodFormPage } from "./pages/FoodFormPage";
import { FoodsPage } from "./pages/FoodsPage";
import { RecipeDetailPage, SavedRecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipesPage } from "./pages/RecipesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ShopPage } from "./pages/ShopPage";
import { TodayPage } from "./pages/TodayPage";
import { useLocale } from "./i18n/useLocale";
import type { MealType } from "./types";

export default function App() {
  const { locale, t } = useLocale();
  const [route, setRoute] = useState<AppRoute>("today");
  const [settingsReturnRoute, setSettingsReturnRoute] = useState<AppRoute>("today");
  const [editingFoodId, setEditingFoodId] = useState<string>();
  const [selectedReferenceFoodId, setSelectedReferenceFoodId] = useState<string>();
  const [selectedMealType, setSelectedMealType] = useState<MealType>();
  const [selectedSavedRecipeId, setSelectedSavedRecipeId] = useState<string>();

  const titles: Record<AppRoute, string> = {
    today: t("nav.today"),
    foods: t("route.foodLibrary"),
    recipes: t("nav.recipes"),
    shop: t("nav.shop"),
    settings: t("route.settings"),
    "add-food": t("route.addFood"),
    "confirm-food": t("route.addFood"),
    "custom-food": t("route.customFood"),
    "edit-food": t("route.editFood"),
    "recipe-detail": t("route.recipe"),
    "saved-recipe-detail": t("route.savedRecipe"),
  };
  const eyebrows: Partial<Record<AppRoute, string>> = {
    foods: t("eyebrow.ingredients"),
    settings: t("eyebrow.preferences"),
    "add-food": t("route.foodLibrary"),
    "confirm-food": t("eyebrow.quickAdd"),
    "custom-food": t("eyebrow.packageOrEstimate"),
    "edit-food": t("route.foodLibrary"),
    "recipe-detail": t("eyebrow.today"),
    "saved-recipe-detail": t("eyebrow.myRecipes"),
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t("app.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.description"));
  }, [locale, t]);

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
  } else if (route === "shop") {
    content = <ShopPage />;
  } else if (route === "saved-recipe-detail") {
    content = <SavedRecipeDetailPage recipeId={selectedSavedRecipeId} onDeleted={() => navigate("recipes")} />;
  } else {
    content = null;
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
