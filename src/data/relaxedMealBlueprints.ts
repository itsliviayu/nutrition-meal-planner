import type { RecipeTemplate } from "../types";

export const relaxedMealBlueprints: RecipeTemplate[] = [
  {
    id: "relaxed-breakfast",
    name: "Flexible Breakfast",
    mealTypes: ["breakfast"],
    cookingTime: 0,
    equipment: [],
    tags: ["breakfast", "relaxed"],
    slots: [{ id: "items", type: "specific", minItems: 1, maxItems: 3, optional: false }],
    nameRule: { ingredientSlotIds: ["items"], suffix: "Breakfast", maxIngredients: 2 },
    instructionSteps: [{ text: "Prepare {items} and serve together." }],
  },
  {
    id: "relaxed-lunch",
    name: "Flexible Lunch",
    mealTypes: ["lunch"],
    cookingTime: 0,
    equipment: [],
    tags: ["lunch", "relaxed"],
    slots: [{ id: "items", type: "specific", minItems: 2, maxItems: 4, optional: false }],
    nameRule: { ingredientSlotIds: ["items"], suffix: "Lunch", maxIngredients: 2 },
    instructionSteps: [{ text: "Prepare {items} and serve together." }],
  },
  {
    id: "relaxed-snack",
    name: "Flexible Snack",
    mealTypes: ["snack"],
    cookingTime: 0,
    equipment: [],
    tags: ["snack", "relaxed"],
    slots: [{ id: "items", type: "specific", minItems: 1, maxItems: 2, optional: false }],
    nameRule: { ingredientSlotIds: ["items"], suffix: "Snack", maxIngredients: 2 },
    instructionSteps: [{ text: "Prepare {items} and serve together." }],
  },
];
