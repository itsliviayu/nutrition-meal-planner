import { describe, expect, it } from "vitest";
import { cookingTechniques } from "../data/cookingTechniques";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import { recipeTemplates } from "../data/recipeTemplates";
import type { Equipment, Food, MealPlan } from "../types";
import { buildTechniqueRecipe, getCompatibleTechniques } from "./cookingTechnique";
import { createSavedRecipeSnapshot, deriveGeneratedRecipe, deriveSavedRecipeDisplay } from "./generatedRecipe";
import { calculateMealNutrition } from "./nutritionCalculator";
import { resolveMealPortions } from "./planNutrition";

const userFood = (referenceId: string): Food => createUserFoodFromReference(
  referenceFoods.find((food) => food.id === referenceId)!,
  { id: `user-${referenceId}`, inStock: true },
);
const egg = userFood("egg");
const spinach = userFood("spinach");
const toast = userFood("wholemeal-toast");
const yogurt = userFood("greek-yogurt");
const banana = userFood("banana");
const blueprint = recipeTemplates.find((template) => template.id === "eggs-toast-plate")!;
const compatible = (foods: Food[], allowedEquipment: Equipment[] = ["hob", "microwave", "oven"], maxCookingTime = 30) =>
  getCompatibleTechniques({ blueprint, mealType: "breakfast", foods, allowedEquipment, maxCookingTime });

const eggMeal = (techniqueId: "scramble" | "omelette"): MealPlan => {
  const foods = [egg, spinach, toast];
  const items = foods.map((food) => ({ foodId: food.id, amount: food.defaultServing, unit: food.servingUnit, locked: false }));
  return {
    id: "egg-meal",
    type: "breakfast",
    name: "Egg breakfast",
    items,
    recipeTemplateId: blueprint.id,
    techniqueId,
    nutrition: calculateMealNutrition(resolveMealPortions(items, foods)),
    cookingTime: 10,
    equipment: ["hob"],
  };
};

describe("CookingTechnique compatibility and variants", () => {
  it("offers multiple techniques for one egg, spinach and toast composition", () => {
    expect(compatible([egg, spinach, toast]).map((item) => item.id)).toEqual(expect.arrayContaining(["scramble", "omelette", "toast_topping"]));
  });

  it("offers at least scramble and omelette for egg and spinach", () => {
    expect(compatible([egg, spinach]).map((item) => item.id)).toEqual(expect.arrayContaining(["scramble", "omelette"]));
  });

  it("does not treat yogurt and banana as an egg or stir-fry technique", () => {
    const ids = compatible([yogurt, banana]).map((item) => item.id);
    expect(ids).not.toContain("omelette");
    expect(ids).not.toContain("stir_fry");
  });

  it("filters techniques by available equipment", () => {
    expect(compatible([egg, spinach, toast], []).map((item) => item.id)).toEqual([]);
  });

  it("filters techniques by maximum cooking time", () => {
    expect(compatible([egg, spinach, toast], ["hob"], 8).map((item) => item.id)).toEqual(["toast_topping"]);
  });

  it("changes name and instructions but not ingredients or nutrition", () => {
    const foods = [egg, spinach, toast];
    const scrambled = deriveGeneratedRecipe(eggMeal("scramble"), foods);
    const omelette = deriveGeneratedRecipe(eggMeal("omelette"), foods);
    expect(omelette.ingredients).toEqual(scrambled.ingredients);
    expect(omelette.nutrition).toEqual(scrambled.nutrition);
    expect(omelette.name).not.toBe(scrambled.name);
    expect(omelette.instructions).not.toEqual(scrambled.instructions);
  });

  it("builds deterministic English and Chinese variant copy", () => {
    const omelette = cookingTechniques.find((item) => item.id === "omelette")!;
    expect(buildTechniqueRecipe(omelette, [egg, spinach, toast], "en").name).toBe("Spinach Omelette with Wholemeal Bread");
    expect(buildTechniqueRecipe(omelette, [egg, spinach, toast], "zh-CN").name).toContain("菠菜欧姆蛋");
  });

  it("does not invent oil, butter, cheese, cream or sauce in egg instructions", () => {
    const scramble = cookingTechniques.find((item) => item.id === "scramble")!;
    expect(buildTechniqueRecipe(scramble, [egg, spinach], "en").instructions.join(" ")).not.toMatch(/oil|butter|cheese|cream|sauce/i);
  });

  it("stores the selected technique in a Saved Recipe snapshot", () => {
    const saved = createSavedRecipeSnapshot(deriveGeneratedRecipe(eggMeal("omelette"), [egg, spinach, toast]));
    expect(saved.techniqueId).toBe("omelette");
    expect(deriveSavedRecipeDisplay(saved, [egg, spinach, toast], "en").name).toContain("Omelette");
  });

  it("keeps an old Saved Recipe snapshot unchanged when techniqueId is absent", () => {
    const legacy = createSavedRecipeSnapshot(deriveGeneratedRecipe(eggMeal("omelette"), [egg, spinach, toast]));
    delete legacy.techniqueId;
    legacy.name = "Original snapshot name";
    legacy.instructions = ["Original snapshot method."];
    expect(deriveSavedRecipeDisplay(legacy, [egg, spinach, toast], "zh-CN")).toEqual({
      name: "Original snapshot name",
      instructions: ["Original snapshot method."],
    });
  });
});
