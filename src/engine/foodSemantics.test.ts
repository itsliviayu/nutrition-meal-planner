import { describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import type { Food } from "../types";
import {
  deriveFoodSemantics,
  effectiveIngredientKind,
  foodHasRole,
  isMeaningfulSemanticComposition,
} from "./foodSemantics";

const customFood = (overrides: Partial<Food>): Food => ({
  id: "custom",
  name: "My Tesco Item",
  category: "protein",
  nutritionBasis: "per_100g",
  nutrition: { calories: 100, protein: 10, carbs: 5, fat: 3, fibre: 1 },
  defaultServing: 100,
  servingUnit: "g",
  inStock: true,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  estimatedNutrition: false,
  tags: ["savoury"],
  compatibleMeals: ["lunch"],
  ...overrides,
});

describe("effective IngredientKind and derived semantics", () => {
  it("prefers an explicit User Food override", () => {
    const reference = referenceFoods.find((food) => food.id === "semi-skimmed-milk")!;
    const food = createUserFoodFromReference(reference, { id: "user-milk" });
    food.ingredientKind = "yogurt_dairy";
    expect(effectiveIngredientKind(food)).toBe("yogurt_dairy");
  });

  it("resolves a legacy Reference-linked food from referenceFoodId", () => {
    const food = createUserFoodFromReference(referenceFoods.find((item) => item.id === "pasta")!, { id: "legacy-pasta" });
    delete food.ingredientKind;
    expect(effectiveIngredientKind(food)).toBe("pasta");
  });

  it("uses conservative category fallbacks without inspecting the name", () => {
    expect(effectiveIngredientKind(customFood({ name: "Ham", ingredientKind: undefined }))).toBe("other_protein");
    expect(effectiveIngredientKind(customFood({ name: "Pasta", category: "carb", ingredientKind: undefined }))).toBe("other_carb");
  });

  it("derives cooked meat roles and only enables cold assembly when no_cook is present", () => {
    const warmHam = customFood({ ingredientKind: "cooked_meat" });
    const coldHam = customFood({ ingredientKind: "cooked_meat", tags: ["savoury", "no_cook"] });
    expect(deriveFoodSemantics(coldHam).roles).toEqual(expect.arrayContaining(["main_protein", "filling", "topping", "mix_in"]));
    expect(deriveFoodSemantics(warmHam).capabilities.coldAssemblyCompatible).toBe(false);
    expect(deriveFoodSemantics(coldHam).capabilities.coldAssemblyCompatible).toBe(true);
  });

  it("keeps milk liquid-only and sauce out of the main role", () => {
    const milk = customFood({ ingredientKind: "milk" });
    const sauce = customFood({ category: "fat_sauce", ingredientKind: "sauce" });
    expect(deriveFoodSemantics(milk).roles).toEqual(["liquid"]);
    expect(foodHasRole(milk, "main_protein")).toBe(false);
    expect(foodHasRole(sauce, "main_protein")).toBe(false);
    expect(isMeaningfulSemanticComposition([sauce], "lunch")).toBe(false);
  });
});
