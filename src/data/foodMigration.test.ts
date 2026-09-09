import { describe, expect, it } from "vitest";
import { referenceFoods } from "./seedFoods";
import { migratePersistedFood } from "./foodMigration";

describe("food persistence migration", () => {
  it("recognises original seed foods as reference foods", () => {
    const legacyEgg = { ...referenceFoods.find((food) => food.id === "egg")! };
    const { nutritionSource: _source, ...withoutSource } = legacyEgg;
    const migrated = migratePersistedFood(withoutSource);

    expect(migrated.nutritionSource).toBe("reference");
    expect(migrated.referenceFoodId).toBe("egg");
  });

  it("preserves custom foods and infers their previous estimate state", () => {
    const custom = referenceFoods.find((food) => food.id === "greek-yogurt")!;
    const { nutritionSource: _source, ...withoutSource } = {
      ...custom,
      id: "custom-id",
      name: "Lidl Yogurt",
      estimatedNutrition: false,
    };
    const migrated = migratePersistedFood(withoutSource);

    expect(migrated.name).toBe("Lidl Yogurt");
    expect(migrated.nutritionSource).toBe("package_label");
    expect(migrated.referenceFoodId).toBeUndefined();
  });
});
