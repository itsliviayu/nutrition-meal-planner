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
});
