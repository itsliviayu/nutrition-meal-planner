import type { FoodCategory, IngredientKind } from "../types";

export const INGREDIENT_KINDS_BY_CATEGORY: Record<FoodCategory, IngredientKind[]> = {
  protein: ["egg", "cooked_meat", "raw_meat", "fish_seafood", "tofu_legume", "yogurt_dairy", "cheese", "milk", "other_protein"],
  carb: ["bread", "pasta", "rice", "noodles", "wrap", "oats", "potato", "grain", "cereal", "other_carb"],
  vegetable: ["vegetable"],
  fruit: ["fruit"],
  fat_sauce: ["sauce", "spread", "oil_fat", "nuts_seeds"],
  composite: ["composite", "other"],
};

const DEFAULT_INGREDIENT_KIND_BY_CATEGORY: Record<FoodCategory, IngredientKind> = {
  protein: "other_protein",
  carb: "other_carb",
  vegetable: "vegetable",
  fruit: "fruit",
  fat_sauce: "sauce",
  composite: "composite",
};

export const defaultIngredientKindForCategory = (category: FoodCategory): IngredientKind =>
  DEFAULT_INGREDIENT_KIND_BY_CATEGORY[category];

export const isIngredientKindCompatibleWithCategory = (
  ingredientKind: IngredientKind,
  category: FoodCategory,
): boolean => INGREDIENT_KINDS_BY_CATEGORY[category].includes(ingredientKind);

const referenceKindGroups: Array<[IngredientKind, string[]]> = [
  ["egg", ["egg"]],
  ["raw_meat", ["chicken-breast", "chicken-thigh", "lean-beef", "turkey-breast", "pork-loin", "rump-steak-strips"]],
  ["cooked_meat", ["pork-sausages", "back-bacon", "boiled-ham", "turkey-slices", "pork-mince"]],
  ["fish_seafood", ["salmon", "tuna", "cod", "prawns", "haddock", "pollock", "mackerel", "sardines"]],
  ["tofu_legume", ["tofu", "chickpeas", "kidney-beans", "lentils", "baked-beans", "edamame", "butter-beans", "black-eye-beans"]],
  ["yogurt_dairy", ["greek-yogurt", "skyr", "cottage-cheese", "low-fat-yogurt", "whole-milk-yogurt", "soya-fruit-yogurt"]],
  ["cheese", ["cheddar", "mozzarella", "feta", "halloumi", "ricotta"]],
  ["milk", ["semi-skimmed-milk"]],
  ["bread", ["wholemeal-toast", "white-bread", "bagel", "seeded-bread", "white-pitta", "naan", "rye-crispbread", "cream-crackers", "crumpets"]],
  ["pasta", ["pasta", "wholewheat-pasta"]],
  ["rice", ["brown-rice", "white-rice"]],
  ["noodles", ["egg-noodles", "rice-noodles"]],
  ["wrap", ["tortilla-wrap", "chapati"]],
  ["oats", ["oats"]],
  ["potato", ["potato", "sweet-potato"]],
  ["grain", ["couscous", "quinoa", "bulgur-wheat", "polenta", "pearl-barley"]],
  ["cereal", ["swiss-muesli", "granola", "wheat-biscuits", "cornflakes"]],
  ["oil_fat", ["olive-oil", "rapeseed-oil", "butter"]],
  ["spread", ["peanut-butter", "houmous", "tahini", "avocado"]],
];

export const REFERENCE_INGREDIENT_KIND_OVERRIDES: Readonly<Record<string, IngredientKind>> = Object.freeze(
  Object.fromEntries(referenceKindGroups.flatMap(([kind, ids]) => ids.map((id) => [id, kind]))),
);

export const ingredientKindForReference = (
  id: string,
  category: FoodCategory,
): IngredientKind => REFERENCE_INGREDIENT_KIND_OVERRIDES[id] ?? defaultIngredientKindForCategory(category);
