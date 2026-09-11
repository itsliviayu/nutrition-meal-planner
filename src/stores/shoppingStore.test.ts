import { beforeEach, describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/seedFoods";
import { getGeneratedRecipeNeeds, getTrySomethingNewSuggestions } from "../engine/shoppingEngine";
import type { Food, GeneratedRecipe, ShoppingItem, ShoppingNeed } from "../types";
import { useAppStore } from "./useAppStore";

const broccoliReference = referenceFoods.find((food) => food.id === "broccoli")!;
const codReference = referenceFoods.find((food) => food.id === "cod")!;
const broccoli = (): Food => createUserFoodFromReference(broccoliReference, {
  id: "user-broccoli",
  inStock: false,
  regularBuy: false,
  favourite: false,
});

const recipeFor = (food: Food): GeneratedRecipe => ({
  name: "Broccoli Bowl",
  sourceTemplateId: "rice-bowl",
  mealType: "lunch",
  ingredients: [{
    foodId: food.id,
    referenceFoodId: food.referenceFoodId,
    foodName: food.name,
    amount: 100,
    unit: "g",
    category: food.category,
    inStock: food.inStock,
    locked: false,
  }],
  cookingTime: 20,
  equipment: ["hob"],
  instructions: ["Cook."],
  nutrition: { calories: 34, protein: 2.8, carbs: 2.7, fat: 0.4, fibre: 2.6 },
  fibreDataComplete: true,
});

const referenceShoppingItem = (): ShoppingItem => ({
  id: "shopping-cod",
  referenceFoodId: "cod",
  displayName: "Cod",
  sources: ["saved_recipe"],
  createdAt: "2026-09-10T12:00:00.000Z",
});

const resetStore = (foods: Food[] = [broccoli()], shoppingItems: ShoppingItem[] = []) => {
  useAppStore.setState({
    foods,
    shoppingItems,
    dailyPlans: { free: null, inventory: null },
    activePlanningMode: "free",
    savedRecipes: [],
    recentFoodIds: [],
    recentRecipeTemplateIds: [],
    generationMessage: null,
  });
};

describe("Shopping store", () => {
  beforeEach(() => resetStore());

  it("deduplicates Recipe and Saved Recipe needs into one Shopping Item", () => {
    const need: ShoppingNeed = {
      foodId: "user-broccoli",
      referenceFoodId: "broccoli",
      displayName: "Broccoli",
      status: "missing",
    };

    useAppStore.getState().addShoppingNeeds([need], "recipe");
    useAppStore.getState().addShoppingNeeds([need], "saved_recipe");

    expect(useAppStore.getState().shoppingItems).toHaveLength(1);
    expect(useAppStore.getState().shoppingItems[0].sources).toEqual(["recipe", "saved_recipe"]);
  });

  it("marks an existing User Food In Stock, removes its Shopping Item and clears missing state", () => {
    const food = useAppStore.getState().foods[0];
    useAppStore.getState().addFoodToShopping(food.id);
    const shoppingItem = useAppStore.getState().shoppingItems[0];

    expect(useAppStore.getState().markShoppingItemBought(shoppingItem.id)).toBe(true);
    const updatedFood = useAppStore.getState().foods[0];
    expect(updatedFood.inStock).toBe(true);
    expect(useAppStore.getState().shoppingItems).toEqual([]);
    expect(getGeneratedRecipeNeeds(recipeFor(updatedFood), [updatedFood])).toEqual([]);
  });

  it("creates an independent in-stock User Food copy when a reference-only item is bought", () => {
    const referenceBefore = JSON.stringify(codReference);
    resetStore([], [referenceShoppingItem()]);

    expect(useAppStore.getState().markShoppingItemBought("shopping-cod")).toBe(true);
    const added = useAppStore.getState().foods[0];
    expect(added).toEqual(expect.objectContaining({ referenceFoodId: "cod", inStock: true }));
    expect(added.id).not.toBe("cod");
    expect(JSON.stringify(codReference)).toBe(referenceBefore);
    expect(useAppStore.getState().shoppingItems).toEqual([]);
  });

  it("adds a recommendation to My Foods as out of stock by default and removes it from discovery", () => {
    const referenceBefore = JSON.stringify(codReference);
    resetStore([]);
    expect(getTrySomethingNewSuggestions([codReference], useAppStore.getState().foods)).toHaveLength(1);

    const added = useAppStore.getState().addReferenceFoodToMyFoods("cod");

    expect(added).toEqual(expect.objectContaining({ referenceFoodId: "cod", inStock: false }));
    expect(added?.id).not.toBe("cod");
    expect(getTrySomethingNewSuggestions([codReference], useAppStore.getState().foods)).toEqual([]);
    expect(JSON.stringify(codReference)).toBe(referenceBefore);
  });

  it("only removes the Shopping record, not its User Food", () => {
    const food = useAppStore.getState().foods[0];
    useAppStore.getState().addFoodToShopping(food.id);
    const itemId = useAppStore.getState().shoppingItems[0].id;

    useAppStore.getState().removeShoppingItem(itemId);

    expect(useAppStore.getState().shoppingItems).toEqual([]);
    expect(useAppStore.getState().foods).toEqual([food]);
  });
});
