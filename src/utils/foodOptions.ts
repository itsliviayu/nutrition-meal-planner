import { INGREDIENT_KINDS_BY_CATEGORY } from "../data/ingredientKinds";
import type { Equipment, FoodCategory, FoodTag, IngredientKind, MealType } from "../types";

export const FOOD_CATEGORIES: Array<{ value: FoodCategory; label: string }> = [
  { value: "protein", label: "Protein" },
  { value: "carb", label: "Carbs" },
  { value: "vegetable", label: "Vegetables" },
  { value: "fruit", label: "Fruit" },
  { value: "fat_sauce", label: "Fat & Sauce" },
  { value: "composite", label: "Composite" },
];

export const FOOD_TAGS: Array<{ value: FoodTag; label: string }> = [
  { value: "high_protein", label: "High protein" },
  { value: "high_fibre", label: "High fibre" },
  { value: "quick", label: "Quick" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "freezer", label: "Freezer" },
  { value: "sweet", label: "Sweet" },
  { value: "savoury", label: "Savoury" },
  { value: "no_cook", label: "No cook" },
  { value: "oven", label: "Oven" },
  { value: "hob", label: "Hob" },
  { value: "microwave", label: "Microwave" },
];

export const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snack", label: "Evening snack" },
];

export const EQUIPMENT: Array<{ value: Equipment; label: string }> = [
  { value: "hob", label: "Hob" },
  { value: "oven", label: "Oven" },
  { value: "microwave", label: "Microwave" },
  { value: "fridge", label: "Fridge" },
];

export const ingredientKindOptionsForCategory = (
  category: FoodCategory,
): IngredientKind[] => INGREDIENT_KINDS_BY_CATEGORY[category];

export const categoryLabel = (category: FoodCategory): string =>
  FOOD_CATEGORIES.find((option) => option.value === category)?.label ?? category;
