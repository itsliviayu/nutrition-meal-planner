import { describe, expect, it } from "vitest";
import { cookingTechniques } from "../data/cookingTechniques";
import { createUserFoodFromReference } from "../data/foodFactory";
import { referenceFoods } from "../data/referenceFoods";
import { recipeTemplates } from "../data/recipeTemplates";
import type { Equipment, Food, MealPlan, MealType } from "../types";
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
const techniqueIds = (
  blueprintId: string,
  mealType: MealType,
  foods: Food[],
  allowedEquipment: Equipment[] = ["hob", "microwave", "oven"],
) => getCompatibleTechniques({
  blueprint: recipeTemplates.find((template) => template.id === blueprintId)!,
  mealType,
  foods,
  allowedEquipment,
  maxCookingTime: 30,
}).map((technique) => technique.id);

const customFood = (id: string, overrides: Partial<Food>): Food => ({
  id,
  name: id,
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
  compatibleMeals: ["breakfast", "lunch", "snack"],
  ...overrides,
});

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

  it("uses Custom Ham as a cooked filling or mix-in without treating it as yogurt or raw meat", () => {
    const ham = customFood("My Ham", { ingredientKind: "cooked_meat", tags: ["savoury", "no_cook"] });
    const customPasta = customFood("Barilla Spaghetti", { category: "carb", ingredientKind: "pasta" });
    const customWrap = customFood("My Wrap", { category: "carb", ingredientKind: "wrap" });

    expect(techniqueIds("eggs-toast-plate", "breakfast", [egg, ham, spinach])).toContain("omelette");
    expect(techniqueIds("savoury-toast", "breakfast", [toast, ham, spinach])).toContain("toast_topping");
    expect(techniqueIds("wrap", "lunch", [customWrap, ham, spinach], [])).toContain("wrap_fill");
    expect(techniqueIds("pasta", "lunch", [customPasta, ham, spinach])).toContain("pasta_toss");
    expect(techniqueIds("yogurt-bowl", "breakfast", [yogurt, ham, banana])).not.toContain("yogurt_bowl");

    const pastaTechnique = cookingTechniques.find((technique) => technique.id === "pasta_toss")!;
    const instructions = buildTechniqueRecipe(pastaTechnique, [customPasta, ham, spinach], "en").instructions.join(" ");
    expect(instructions).toContain("Add the my ham directly");
    expect(instructions).not.toContain("my ham until cooked through");
  });

  it("recognises fully custom pasta, rice and wrap bases without reference IDs", () => {
    const ham = customFood("My Ham", { ingredientKind: "cooked_meat", tags: ["savoury", "no_cook"] });
    const pasta = customFood("Barilla Spaghetti", { category: "carb", ingredientKind: "pasta" });
    const rice = customFood("Microwave Rice", { category: "carb", ingredientKind: "rice" });
    const wrap = customFood("Large Flatbread", { category: "carb", ingredientKind: "wrap" });

    expect(techniqueIds("pasta", "lunch", [pasta, ham, spinach])).toContain("pasta_toss");
    expect(techniqueIds("rice-bowl", "lunch", [rice, ham, spinach], [])).toContain("rice_bowl_assemble");
    expect(techniqueIds("wrap", "lunch", [wrap, ham, spinach], [])).toContain("wrap_fill");
  });

  it("uses milk with oats and cold breakfast but never as a pan-seared protein", () => {
    const milk = customFood("My Milk", { ingredientKind: "milk", tags: ["breakfast", "no_cook"] });
    const customOats = customFood("My Oats", { category: "carb", ingredientKind: "oats", tags: ["breakfast"] });
    const rice = customFood("My Rice", { category: "carb", ingredientKind: "rice" });

    expect(techniqueIds("oat-bowl", "breakfast", [customOats, milk], ["microwave"])).toContain("oat_bowl");
    expect(techniqueIds("quick-breakfast-plate", "breakfast", [milk, banana], [])).toContain("cold_assemble");
    expect(techniqueIds("rice-bowl", "lunch", [rice, milk, spinach])).not.toContain("pan_sear");
    expect(techniqueIds("rice-bowl", "lunch", [rice, milk, spinach], [])).not.toContain("rice_bowl_assemble");
    const wrap = customFood("My Wrap", { category: "carb", ingredientKind: "wrap" });
    expect(techniqueIds("wrap", "lunch", [wrap, milk, spinach], [])).not.toContain("wrap_fill");
  });

  it("allows raw chicken for pan, stir-fry and oven techniques but never cold assembly", () => {
    const chicken = customFood("My Chicken", { ingredientKind: "raw_meat", tags: ["savoury", "hob", "oven"] });
    const rice = customFood("My Rice", { category: "carb", ingredientKind: "rice" });
    const potato = customFood("My Potato", { category: "carb", ingredientKind: "potato", tags: ["oven"] });

    expect(techniqueIds("rice-bowl", "lunch", [rice, chicken, spinach])).toContain("pan_sear");
    expect(techniqueIds("stir-fry", "lunch", [rice, chicken, spinach])).toContain("stir_fry");
    expect(techniqueIds("oven-tray-meal", "lunch", [potato, chicken, spinach])).toContain("oven_roast");
    expect(techniqueIds("quick-breakfast-plate", "breakfast", [chicken, banana], [])).not.toContain("cold_assemble");

    const panTechnique = cookingTechniques.find((technique) => technique.id === "pan_sear")!;
    expect(buildTechniqueRecipe(panTechnique, [rice, chicken, spinach], "en").instructions.join(" "))
      .toContain("Cook the my chicken until cooked through.");
  });
});
