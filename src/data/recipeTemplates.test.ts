import { describe, expect, it } from "vitest";
import { recipeTemplates } from "./recipeTemplates";

describe("recipeTemplates", () => {
  it("provides the scoped set of 14 Phase 2 templates", () => {
    expect(recipeTemplates).toHaveLength(14);
    expect(recipeTemplates.filter((template) => template.mealTypes.includes("breakfast"))).toHaveLength(5);
    expect(recipeTemplates.filter((template) => template.mealTypes.includes("lunch"))).toHaveLength(6);
    expect(recipeTemplates.filter((template) => template.mealTypes.includes("snack"))).toHaveLength(3);
  });

  it("defines valid slot ranges for every template", () => {
    for (const template of recipeTemplates) {
      expect(template.slots.length).toBeGreaterThan(0);
      for (const slot of template.slots) {
        expect(slot.minItems).toBeGreaterThanOrEqual(0);
        expect(slot.maxItems).toBeGreaterThanOrEqual(slot.minItems);
        expect(slot.optional ? slot.minItems === 0 : slot.minItems > 0).toBe(true);
      }
    }
  });

  it("provides concise deterministic instructions and naming rules for every template", () => {
    for (const template of recipeTemplates) {
      expect(template.instructionSteps.length).toBeGreaterThanOrEqual(2);
      expect(template.instructionSteps.length).toBeLessThanOrEqual(6);
      expect(template.nameRule.maxIngredients).toBeGreaterThan(0);
      const slotIds = new Set(template.slots.map((slot) => slot.id));
      for (const slotId of template.nameRule.ingredientSlotIds) expect(slotIds.has(slotId)).toBe(true);
      for (const step of template.instructionSteps) {
        const placeholders = [...step.text.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
        for (const slotId of [...placeholders, ...(step.whenSlotsPresent ?? [])]) {
          expect(slotIds.has(slotId)).toBe(true);
        }
      }
    }
  });

  it("keeps no-cook templates free from unnecessary oven, pan, boiling or frying steps", () => {
    const noCookInstructions = recipeTemplates
      .filter((template) => template.tags.includes("no_cook"))
      .flatMap((template) => template.instructionSteps.map((step) => step.text))
      .join(" ");
    expect(noCookInstructions).not.toMatch(/\b(oven|pan|boil|fry)\b/i);
  });
});
