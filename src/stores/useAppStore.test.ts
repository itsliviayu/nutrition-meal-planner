import { beforeEach, describe, expect, it } from "vitest";
import { defaultProfile } from "../data/defaultProfile";
import { initialUserFoods } from "../data/initialFoods";
import type { DailyPlan, MealPlan, MealType, SavedRecipe } from "../types";
import type { PlanningMode } from "../utils/planningMode";
import {
  APP_STORAGE_VERSION,
  migratePersistedAppData,
  normalizePersistedAppData,
  selectActiveDailyPlan,
  useAppStore,
  type ModeDailyPlans,
  type PersistedAppData,
} from "./useAppStore";

const nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

const meal = (type: MealType, label: string, withEgg = false): MealPlan => ({
  id: `${label}-${type}`,
  type,
  name: `${label} ${type}`,
  items: withEgg
    ? [{ foodId: "starter-egg", amount: 100, unit: "g", locked: false }]
    : [],
  recipeTemplateId: `${label}-${type}-template`,
  nutrition,
  cookingTime: 0,
  equipment: [],
});

const plan = (label: string, withEgg = false): DailyPlan => ({
  date: "2026-09-10",
  breakfast: meal("breakfast", label, withEgg),
  lunch: meal("lunch", label),
  snack: meal("snack", label),
  totalNutrition: nutrition,
  fruitVegPortions: 0,
  nutritionStatus: { calories: "low", protein: "low", fibre: "partial", fruitVeg: "low" },
  fibreDataComplete: false,
});

const freePlan = plan("free", true);
const inventoryPlan = plan("inventory", true);
const savedRecipe: SavedRecipe = {
  id: "saved-recipe",
  name: "Saved Egg Breakfast",
  sourceTemplateId: "quick-breakfast-plate",
  mealType: "breakfast",
  ingredients: [{ foodId: "starter-egg", foodName: "Egg", amount: 100, unit: "g" }],
  cookingTime: 5,
  equipment: [],
  instructions: ["Prepare the egg."],
  nutrition,
  fibreDataComplete: false,
  createdAt: "2026-09-10T12:00:00.000Z",
};

const resetStore = (dailyPlans: ModeDailyPlans = { free: null, inventory: null }) => {
  useAppStore.setState({
    profile: defaultProfile,
    foods: initialUserFoods,
    dailyPlans,
    activePlanningMode: "free",
    savedRecipes: [],
    recentFoodIds: [],
    recentRecipeTemplateIds: [],
    generationMessage: null,
  });
};

beforeEach(() => resetStore());

describe("mode-specific DailyPlan state", () => {
  it("switches from free to inventory without changing either plan", () => {
    resetStore({ free: freePlan, inventory: inventoryPlan });
    const before = useAppStore.getState().dailyPlans;

    useAppStore.getState().setActivePlanningMode("inventory");

    const after = useAppStore.getState();
    expect(after.activePlanningMode).toBe("inventory");
    expect(after.dailyPlans.free).toBe(before.free);
    expect(after.dailyPlans.inventory).toBe(before.inventory);
  });

  it("switches from inventory to free without changing either plan", () => {
    resetStore({ free: freePlan, inventory: inventoryPlan });
    useAppStore.setState({ activePlanningMode: "inventory" });
    const before = useAppStore.getState().dailyPlans;

    useAppStore.getState().setActivePlanningMode("free");

    const after = useAppStore.getState();
    expect(after.activePlanningMode).toBe("free");
    expect(after.dailyPlans.free).toBe(before.free);
    expect(after.dailyPlans.inventory).toBe(before.inventory);
  });

  it("selects the current mode plan and returns null for an ungenerated mode", () => {
    resetStore({ free: freePlan, inventory: null });
    expect(selectActiveDailyPlan(useAppStore.getState())).toBe(freePlan);

    useAppStore.getState().setActivePlanningMode("inventory");
    expect(selectActiveDailyPlan(useAppStore.getState())).toBeNull();

    resetStore({ free: null, inventory: inventoryPlan });
    useAppStore.setState({ activePlanningMode: "inventory" });
    expect(selectActiveDailyPlan(useAppStore.getState())).toBe(inventoryPlan);
  });

  it.each([
    ["free", "inventory"],
    ["inventory", "free"],
  ] as const)("generates only the active %s plan", (activeMode, inactiveMode) => {
    const inactivePlan = plan(`${inactiveMode}-existing`);
    resetStore({
      free: activeMode === "free" ? null : inactivePlan,
      inventory: activeMode === "inventory" ? null : inactivePlan,
    });
    useAppStore.setState({ activePlanningMode: activeMode });

    expect(useAppStore.getState().generateDailyPlan()).toBe(true);

    const state = useAppStore.getState();
    expect(state.dailyPlans[activeMode]).not.toBeNull();
    expect(state.dailyPlans[inactiveMode]).toBe(inactivePlan);
  });

  it.each([
    ["free", "inventory"],
    ["inventory", "free"],
  ] as const)("regenerates a meal only in the active %s plan", (activeMode, inactiveMode) => {
    const inactivePlan = plan(`${inactiveMode}-existing`);
    resetStore({
      free: activeMode === "free" ? null : inactivePlan,
      inventory: activeMode === "inventory" ? null : inactivePlan,
    });
    useAppStore.setState({ activePlanningMode: activeMode });
    expect(useAppStore.getState().generateDailyPlan()).toBe(true);
    const activePlanBefore = useAppStore.getState().dailyPlans[activeMode];

    expect(useAppStore.getState().regenerateMeal("breakfast")).toBe(true);

    const state = useAppStore.getState();
    expect(state.dailyPlans[activeMode]).not.toBe(activePlanBefore);
    expect(state.dailyPlans[inactiveMode]).toBe(inactivePlan);
  });

  it("updates a portion only in the active plan", () => {
    resetStore({ free: freePlan, inventory: inventoryPlan });

    useAppStore.getState().updateMealItemPortion("breakfast", "starter-egg", 120);

    const state = useAppStore.getState();
    expect(state.dailyPlans.free?.breakfast.items[0].amount).toBe(120);
    expect(state.dailyPlans.inventory).toBe(inventoryPlan);
    expect(state.dailyPlans.inventory?.breakfast.items[0].amount).toBe(100);
  });

  it("toggles an item lock only in the active plan", () => {
    resetStore({ free: freePlan, inventory: inventoryPlan });
    useAppStore.setState({ activePlanningMode: "inventory" });

    useAppStore.getState().toggleMealItemLock("breakfast", "starter-egg");

    const state = useAppStore.getState();
    expect(state.dailyPlans.inventory?.breakfast.items[0].locked).toBe(true);
    expect(state.dailyPlans.free).toBe(freePlan);
    expect(state.dailyPlans.free?.breakfast.items[0].locked).toBe(false);
  });
});

describe("V4 persisted app data", () => {
  it("restores both plans, the selected mode and Saved Recipes after a JSON round trip", () => {
    const saved: PersistedAppData = {
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlans: { free: freePlan, inventory: inventoryPlan },
      activePlanningMode: "inventory",
      savedRecipes: [savedRecipe],
      recentFoodIds: ["starter-egg"],
      recentRecipeTemplateIds: ["egg-snack"],
    };

    const restored = normalizePersistedAppData(JSON.parse(JSON.stringify(saved)));

    expect(restored.dailyPlans.free).toEqual(freePlan);
    expect(restored.dailyPlans.inventory).toEqual(inventoryPlan);
    expect(restored.activePlanningMode).toBe("inventory");
    expect(restored.savedRecipes).toEqual([savedRecipe]);
  });

  it("adds Phase 2.2 defaults without overwriting existing foods or profile", () => {
    const restored = normalizePersistedAppData({ profile: defaultProfile, foods: initialUserFoods });
    expect(restored.foods).toBe(initialUserFoods);
    expect(restored.profile).toBe(defaultProfile);
    expect(restored.dailyPlans).toEqual({ free: null, inventory: null });
    expect(restored.activePlanningMode).toBe("free");
    expect(restored.savedRecipes).toEqual([]);
    expect(restored.recentFoodIds).toEqual([]);
  });
});

describe("V2 persistence migration", () => {
  it.each([
    [false, "free"],
    [true, "inventory"],
  ] as const)("moves the legacy plan selected by inventoryOnly=%s into the %s slot", (
    inventoryOnly,
    expectedMode,
  ) => {
    const restored = migratePersistedAppData({
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlan: freePlan,
      inventoryOnly,
      recentFoodIds: [],
      recentRecipeTemplateIds: [],
    }, 2);
    const otherMode: PlanningMode = expectedMode === "free" ? "inventory" : "free";

    expect(APP_STORAGE_VERSION).toBe(4);
    expect(restored.activePlanningMode).toBe(expectedMode);
    expect(restored.dailyPlans[expectedMode]).toBe(freePlan);
    expect(restored.dailyPlans[otherMode]).toBeNull();
  });
});

describe("V3 persistence migration", () => {
  it("preserves both plan slots and active mode while adding an empty Saved Recipes list", () => {
    const restored = migratePersistedAppData({
      profile: defaultProfile,
      foods: initialUserFoods,
      dailyPlans: { free: freePlan, inventory: inventoryPlan },
      activePlanningMode: "inventory",
      recentFoodIds: ["starter-egg"],
      recentRecipeTemplateIds: ["egg-snack"],
    }, 3);

    expect(restored.dailyPlans).toEqual({ free: freePlan, inventory: inventoryPlan });
    expect(restored.activePlanningMode).toBe("inventory");
    expect(restored.savedRecipes).toEqual([]);
    expect(restored.foods).toBe(initialUserFoods);
    expect(restored.profile).toBe(defaultProfile);
  });
});
