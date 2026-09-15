import { defaultIngredientKindForCategory } from "../data/ingredientKinds";
import { referenceFoods } from "../data/referenceFoods";
import type { CookingTechniqueId, Food, IngredientKind, MealType } from "../types";

export type RecipeRole =
  | "base"
  | "main_protein"
  | "filling"
  | "topping"
  | "mix_in"
  | "side"
  | "sauce"
  | "liquid";

export interface CookingCapabilities {
  readyToEat: boolean;
  panCookable: boolean;
  stirFryable: boolean;
  ovenCookable: boolean;
  coldAssemblyCompatible: boolean;
}

export interface FoodSemantics {
  ingredientKind: IngredientKind;
  roles: RecipeRole[];
  capabilities: CookingCapabilities;
}

export const effectiveIngredientKind = (food: Food): IngredientKind => {
  if (food.ingredientKind) return food.ingredientKind;
  if (food.referenceFoodId) {
    const reference = referenceFoods.find((item) => item.id === food.referenceFoodId);
    if (reference) return reference.ingredientKind;
  }
  return defaultIngredientKindForCategory(food.category);
};

const rolesByKind: Record<IngredientKind, RecipeRole[]> = {
  egg: ["main_protein", "filling", "topping", "mix_in"],
  cooked_meat: ["main_protein", "filling", "topping", "mix_in"],
  raw_meat: ["main_protein", "filling", "mix_in"],
  fish_seafood: ["main_protein", "filling", "topping", "mix_in"],
  tofu_legume: ["main_protein", "filling", "topping", "mix_in", "side"],
  yogurt_dairy: ["base", "topping", "mix_in"],
  cheese: ["filling", "topping", "mix_in", "side"],
  milk: ["liquid"],
  other_protein: ["main_protein", "filling", "side"],
  bread: ["base", "side"],
  pasta: ["base"],
  rice: ["base"],
  noodles: ["base"],
  wrap: ["base"],
  oats: ["base"],
  potato: ["base", "side"],
  grain: ["base", "side"],
  cereal: ["base", "topping"],
  other_carb: ["base", "side"],
  vegetable: ["filling", "topping", "mix_in", "side"],
  fruit: ["topping", "mix_in", "side"],
  sauce: ["sauce", "mix_in"],
  spread: ["sauce", "filling", "topping"],
  oil_fat: ["sauce", "mix_in"],
  nuts_seeds: ["topping", "mix_in", "side"],
  composite: ["base", "side"],
  other: ["side"],
};

const kinds = (food: Food, values: IngredientKind[]): boolean => values.includes(effectiveIngredientKind(food));

export const deriveFoodSemantics = (food: Food): FoodSemantics => {
  const ingredientKind = effectiveIngredientKind(food);
  const readyToEat = food.tags.includes("no_cook")
    || ["yogurt_dairy", "cheese", "milk", "bread", "wrap", "cereal", "fruit", "sauce", "spread", "oil_fat", "nuts_seeds"].includes(ingredientKind);
  const panCookable = ["egg", "cooked_meat", "raw_meat", "fish_seafood", "tofu_legume", "vegetable", "potato"].includes(ingredientKind)
    || food.tags.includes("hob");
  const stirFryable = ["cooked_meat", "raw_meat", "fish_seafood", "tofu_legume", "vegetable", "noodles"].includes(ingredientKind)
    || (food.tags.includes("hob") && food.category !== "fat_sauce");
  const ovenCookable = ["raw_meat", "fish_seafood", "tofu_legume", "vegetable", "potato", "composite"].includes(ingredientKind)
    || food.tags.includes("oven");
  return {
    ingredientKind,
    roles: [...rolesByKind[ingredientKind]],
    capabilities: {
      readyToEat,
      panCookable,
      stirFryable,
      ovenCookable,
      coldAssemblyCompatible: readyToEat,
    },
  };
};

export const foodHasRole = (food: Food, role: RecipeRole): boolean =>
  deriveFoodSemantics(food).roles.includes(role);

const hasKind = (foods: Food[], values: IngredientKind[]): boolean =>
  foods.some((food) => kinds(food, values));
const hasRole = (foods: Food[], role: RecipeRole): boolean => foods.some((food) => foodHasRole(food, role));
const countRole = (foods: Food[], role: RecipeRole): number => foods.filter((food) => foodHasRole(food, role)).length;

export const culinaryCompatibilityScore = (
  techniqueId: CookingTechniqueId,
  foods: Food[],
): number => {
  const hasVegetable = hasKind(foods, ["vegetable"]);
  const hasFruit = hasKind(foods, ["fruit"]);
  const hasMain = hasRole(foods, "main_protein");
  const hasSauce = hasRole(foods, "sauce");
  const hasTopping = hasRole(foods, "topping");
  switch (techniqueId) {
    case "scramble":
    case "omelette":
      return hasKind(foods, ["egg"]) ? Math.min(1, 0.7 + (hasVegetable ? 0.15 : 0) + (hasKind(foods, ["cheese", "cooked_meat"]) ? 0.15 : 0)) : 0;
    case "pasta_toss":
      return hasKind(foods, ["pasta"]) ? Math.min(1, 0.55 + (hasMain ? 0.2 : 0) + (hasVegetable ? 0.15 : 0) + (hasSauce || hasTopping ? 0.1 : 0)) : 0;
    case "rice_bowl_assemble":
      return hasKind(foods, ["rice"]) ? Math.min(1, 0.55 + (hasMain ? 0.2 : 0) + (hasVegetable ? 0.15 : 0) + (hasSauce ? 0.1 : 0)) : 0;
    case "wrap_fill":
      return hasKind(foods, ["wrap"]) ? Math.min(1, 0.55 + (hasRole(foods, "filling") ? 0.25 : 0) + (hasVegetable ? 0.1 : 0) + (hasSauce || hasTopping ? 0.1 : 0)) : 0;
    case "yogurt_bowl":
      return hasKind(foods, ["yogurt_dairy"]) ? Math.min(1, 0.65 + (hasFruit ? 0.2 : 0) + (hasTopping ? 0.15 : 0)) : 0;
    case "oat_bowl":
      return hasKind(foods, ["oats"]) ? Math.min(1, 0.55 + (hasKind(foods, ["milk", "yogurt_dairy"]) ? 0.25 : 0) + (hasFruit ? 0.15 : 0) + (hasTopping ? 0.05 : 0)) : 0;
    case "toast_topping":
      return hasKind(foods, ["bread"]) ? Math.min(1, 0.6 + (hasRole(foods, "filling") || hasTopping ? 0.3 : 0) + (hasVegetable || hasFruit ? 0.1 : 0)) : 0;
    case "stir_fry":
      return hasVegetable ? Math.min(1, 0.55 + (hasMain ? 0.25 : 0) + (hasKind(foods, ["rice", "noodles"]) ? 0.1 : 0) + (hasSauce ? 0.1 : 0)) : 0;
    case "pan_sear":
      return hasMain ? Math.min(1, 0.65 + (countRole(foods, "side") > 0 || hasVegetable ? 0.25 : 0) + (hasSauce ? 0.1 : 0)) : 0;
    case "oven_roast":
      return Math.min(1, 0.55 + (hasMain ? 0.2 : 0) + (hasVegetable ? 0.15 : 0) + (hasKind(foods, ["potato"]) ? 0.1 : 0));
    case "boil_and_assemble":
      return hasRole(foods, "base") ? Math.min(1, 0.6 + (hasMain ? 0.2 : 0) + (hasVegetable ? 0.1 : 0) + (hasSauce ? 0.1 : 0)) : 0;
    case "cold_assemble":
      return Math.min(1, 0.55 + (hasRole(foods, "base") ? 0.15 : 0) + (hasMain ? 0.15 : 0) + (hasFruit || hasVegetable ? 0.15 : 0));
  }
};

export const isMeaningfulSemanticComposition = (foods: Food[], mealType: MealType): boolean => {
  if (foods.length === 0) return false;
  if (foods.every((food) => deriveFoodSemantics(food).roles.every((role) => role === "sauce" || role === "mix_in"))) return false;
  const hasMain = hasRole(foods, "main_protein");
  const hasFruit = hasKind(foods, ["fruit"]);
  const hasVegetable = hasKind(foods, ["vegetable"]);
  if (mealType === "lunch") return foods.length >= 2 && (hasMain || (hasRole(foods, "base") && hasVegetable));
  if (mealType === "breakfast") return hasRole(foods, "base") || hasMain || hasFruit;
  return foods.length === 1 ? hasFruit || hasMain || hasKind(foods, ["yogurt_dairy", "composite"]) : hasFruit || hasMain;
};
