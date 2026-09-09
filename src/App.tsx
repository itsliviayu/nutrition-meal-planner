import { useState } from "react";
import { AppShell, type AppRoute } from "./components/AppShell";
import { AddFoodPage } from "./pages/AddFoodPage";
import { ConfirmCommonFoodPage } from "./pages/ConfirmCommonFoodPage";
import { FoodFormPage } from "./pages/FoodFormPage";
import { FoodsPage } from "./pages/FoodsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SettingsPage } from "./pages/SettingsPage";

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
};

const eyebrows: Partial<Record<AppRoute, string>> = {
  foods: "Your ingredients",
  settings: "Your preferences",
  "add-food": "Food Library",
  "confirm-food": "Quick add",
  "custom-food": "Package or estimate",
  "edit-food": "Food Library",
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>("foods");
  const [editingFoodId, setEditingFoodId] = useState<string>();
  const [selectedReferenceFoodId, setSelectedReferenceFoodId] = useState<string>();

  const navigate = (nextRoute: AppRoute) => {
    if (nextRoute !== "edit-food") setEditingFoodId(undefined);
    if (nextRoute !== "confirm-food") setSelectedReferenceFoodId(undefined);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  let content;
  if (route === "foods") {
    content = <FoodsPage onAdd={() => navigate("add-food")} onEdit={(id) => { setEditingFoodId(id); setRoute("edit-food"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />;
  } else if (route === "add-food") {
    content = (
      <AddFoodPage
        onSelectReference={(id) => { setSelectedReferenceFoodId(id); setRoute("confirm-food"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onAddCustom={() => navigate("custom-food")}
        onViewExisting={(id) => { setEditingFoodId(id); setRoute("edit-food"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />
    );
  } else if (route === "confirm-food") {
    content = <ConfirmCommonFoodPage referenceFoodId={selectedReferenceFoodId} onDone={() => navigate("foods")} onBack={() => navigate("add-food")} />;
  } else if (route === "custom-food" || route === "edit-food") {
    content = <FoodFormPage foodId={route === "edit-food" ? editingFoodId : undefined} onDone={() => navigate("foods")} onCancel={route === "custom-food" ? () => navigate("add-food") : undefined} />;
  } else if (route === "settings") {
    content = <SettingsPage onDone={() => navigate("foods")} />;
  } else {
    content = <PlaceholderPage kind={route} onOpenFoods={() => navigate("foods")} />;
  }

  const detailPage = route === "add-food" || route === "confirm-food" || route === "custom-food" || route === "edit-food" || route === "settings";
  const goBack = route === "confirm-food" || route === "custom-food"
    ? () => navigate("add-food")
    : () => navigate("foods");

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
