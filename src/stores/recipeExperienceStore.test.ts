import { beforeEach, describe, expect, it } from "vitest";
import { defaultProfile } from "../data/defaultProfile";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import { recipeTemplates } from "../data/recipeTemplates";
import { deriveGeneratedRecipe } from "../engine/generatedRecipe";
import { recalculateDailyPlan } from "../engine/planNutrition";
import type { DailyPlan, Food, MealPlan, MealType } from "../types";
import { useAppStore } from "./useAppStore";

const userFood = (referenceId: string, inStock = true): Food => {
  const reference = referenceFoods.find((food) => food.id === referenceId)!;
  return createUserFoodFromReference(reference, { id: `user-${referenceId}`, inStock });
};

const foods = [
  userFood("pasta"),
  userFood("chicken-breast"),
  userFood("mushroom"),
  userFood("spinach", false),
  userFood("broccoli"),
  userFood("tomato-pasta-sauce"),
  userFood("egg"),
  userFood("wholemeal-toast"),
  userFood("greek-yogurt"),
  userFood("banana"),
];

const byReferenceId = (referenceId: string): Food =>
  foods.find((food) => food.referenceFoodId === referenceId)!;

const mealFrom = (
  referenceIds: string[],
  recipeTemplateId: string,
  type: MealType,
  lockedReferenceId?: string,
): MealPlan => {
  const template = recipeTemplates.find((candidate) => candidate.id === recipeTemplateId)!;
  return {
    id: `${recipeTemplateId}-${type}`,
    type,
    name: template.name,
    items: referenceIds.map((referenceId) => {
      const food = byReferenceId(referenceId);
      return {
        foodId: food.id,
        amount: food.defaultServing,
        unit: food.servingUnit,
        locked: referenceId === lockedReferenceId,
      };
    }),
    recipeTemplateId,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
    cookingTime: template.cookingTime,
    equipment: [...template.equipment],
  };
};

const makePlan = (lockedVegetable = false): DailyPlan => recalculateDailyPlan({
  date: "2026-09-10",
  breakfast: mealFrom(["egg", "wholemeal-toast"], "quick-breakfast-plate", "breakfast"),
  lunch: mealFrom(
    ["pasta", "chicken-breast", "mushroom", "tomato-pasta-sauce"],
    "pasta",
    "lunch",
    lockedVegetable ? "mushroom" : undefined,
  ),
  snack: mealFrom(["greek-yogurt", "banana"], "yogurt-snack", "snack"),
}, foods, defaultProfile);

const resetStore = (freePlan: DailyPlan, inventoryPlan: DailyPlan) => {
  useAppStore.setState({
    profile: defaultProfile,
    foods,
    dailyPlans: { free: freePlan, inventory: inventoryPlan },
    activePlanningMode: "free",
    savedRecipes: [],
    recentFoodIds: [],
    recentRecipeTemplateIds: [],
    generationMessage: null,
  });
};

beforeEach(() => resetStore(makePlan(), makePlan()));

describe("mode-specific ingredient swap", () => {
  it("updates meal and daily nutrition, name and instructions only in the free plan", () => {
    const before = useAppStore.getState();
    const inventoryPlanBefore = before.dailyPlans.inventory;
    const freeMealBefore = before.dailyPlans.free!.lunch;
    const freeTotalBefore = before.dailyPlans.free!.totalNutrition;

    expect(useAppStore.getState().swapMealItem(
      "lunch",
      byReferenceId("mushroom").id,
      byReferenceId("spinach").id,
    )).toBe(true);

    const state = useAppStore.getState();
    const freePlan = state.dailyPlans.free!;
    const replacement = freePlan.lunch.items.find((item) => item.foodId === byReferenceId("spinach").id);
    const generated = deriveGeneratedRecipe(freePlan.lunch, foods);
    expect(replacement).toMatchObject({
      amount: byReferenceId("spinach").defaultServing,
      unit: byReferenceId("spinach").servingUnit,
      locked: false,
    });
    expect(freePlan.lunch.items.some((item) => item.foodId === byReferenceId("mushroom").id)).toBe(false);
    expect(freePlan.lunch.nutrition).not.toEqual(freeMealBefore.nutrition);
    expect(freePlan.totalNutrition).not.toEqual(freeTotalBefore);
    expect(freePlan.lunch.name).toBe("Chicken & Spinach Pasta");
    expect(generated.instructions.join(" ")).toContain("spinach");
    expect(state.dailyPlans.inventory).toBe(inventoryPlanBefore);
  });

  it("updates only the inventory plan when Use What I Have is active", () => {
    const freePlanBefore = useAppStore.getState().dailyPlans.free;
    useAppStore.setState({ activePlanningMode: "inventory" });

    expect(useAppStore.getState().swapMealItem(
      "lunch",
      byReferenceId("mushroom").id,
      byReferenceId("broccoli").id,
    )).toBe(true);

    const state = useAppStore.getState();
    expect(state.dailyPlans.free).toBe(freePlanBefore);
    expect(state.dailyPlans.inventory!.lunch.items.some(
      (item) => item.foodId === byReferenceId("broccoli").id,
    )).toBe(true);
  });

  it("rejects direct swaps of a locked ingredient", () => {
    const lockedPlan = makePlan(true);
    resetStore(lockedPlan, makePlan());

    expect(useAppStore.getState().swapMealItem(
      "lunch",
      byReferenceId("mushroom").id,
      byReferenceId("broccoli").id,
    )).toBe(false);
    expect(useAppStore.getState().dailyPlans.free).toBe(lockedPlan);
  });
});

describe("Saved Recipe snapshots", () => {
  it("saves one independent snapshot and does not duplicate the exact recipe", () => {
    const meal = useAppStore.getState().dailyPlans.free!.lunch;
    const generated = deriveGeneratedRecipe(meal, foods);

    const saved = useAppStore.getState().saveRecipe(generated);
    const savedAgain = useAppStore.getState().saveRecipe(generated);

    expect(savedAgain.id).toBe(saved.id);
    expect(useAppStore.getState().savedRecipes).toHaveLength(1);
    expect(useAppStore.getState().savedRecipes[0]).not.toBe(generated);
  });

  it("keeps the Saved Recipe unchanged after Today swaps an ingredient", () => {
    const meal = useAppStore.getState().dailyPlans.free!.lunch;
    const saved = useAppStore.getState().saveRecipe(deriveGeneratedRecipe(meal, foods));
    const snapshotBefore = JSON.parse(JSON.stringify(saved));

    useAppStore.getState().swapMealItem(
      "lunch",
      byReferenceId("mushroom").id,
      byReferenceId("spinach").id,
    );

    expect(useAppStore.getState().savedRecipes[0]).toEqual(snapshotBefore);
    expect(useAppStore.getState().dailyPlans.free!.lunch.name).toContain("Spinach");
    expect(useAppStore.getState().savedRecipes[0].name).toContain("Mushrooms");
  });

  it("deletes only the Saved Recipe record", () => {
    const planBefore = useAppStore.getState().dailyPlans;
    const generated = deriveGeneratedRecipe(useAppStore.getState().dailyPlans.free!.lunch, foods);
    const saved = useAppStore.getState().saveRecipe(generated);

    useAppStore.getState().deleteSavedRecipe(saved.id);

    expect(useAppStore.getState().savedRecipes).toEqual([]);
    expect(useAppStore.getState().dailyPlans).toBe(planBefore);
  });
});
