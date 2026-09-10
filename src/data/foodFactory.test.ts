import { describe, expect, it } from "vitest";
import {
  createUserFoodFromReference,
  createUserFoodsFromReferences,
  findReferenceDuplicate,
} from "./foodFactory";
import { referenceFoods } from "./seedFoods";

const mushrooms = referenceFoods.find((food) => food.id === "mushroom")!;

describe("reference food copies", () => {
  it("creates an independent user food with reference provenance", () => {
    const referenceCalories = mushrooms.nutrition.calories;
    const userFood = createUserFoodFromReference(mushrooms, {
      id: "user-mushrooms",
      defaultServing: 80,
      store: "  Lidl  ",
      inStock: true,
      favourite: true,
    });

    expect(userFood.referenceFoodId).toBe("mushroom");
    expect(userFood.nutritionSource).toBe("reference");
    expect(userFood.defaultServing).toBe(80);
    expect(userFood.store).toBe("Lidl");
    expect(userFood.inStock).toBe(true);

    userFood.nutrition.calories = 999;
    userFood.tags.push("freezer");
    userFood.aliases?.push("field mushrooms");
    expect(mushrooms.nutrition.calories).toBe(referenceCalories);
    expect(mushrooms.tags).not.toContain("freezer");
    expect(mushrooms.aliases).not.toContain("field mushrooms");
    expect(userFood.referenceSourceId).toBe(mushrooms.referenceSourceId);
  });

  it("finds duplicates by reference id or normalized name", () => {
    const byReference = createUserFoodFromReference(mushrooms, { id: "one" });
    const byName = { ...byReference, id: "two", referenceFoodId: undefined, name: "  MUSHROOMS " };

    expect(findReferenceDuplicate([byReference], mushrooms)?.id).toBe("one");
    expect(findReferenceDuplicate([byName], mushrooms)?.id).toBe("two");
    expect(findReferenceDuplicate([], mushrooms)).toBeUndefined();
  });
});

describe("multi-add reference food copies", () => {
  const salmon = referenceFoods.find((food) => food.id === "salmon")!;
  const courgette = referenceFoods.find((food) => food.id === "courgette")!;

  it("creates independent User Foods that default to out of stock", () => {
    let nextId = 0;
    const additions = createUserFoodsFromReferences(
      [salmon, courgette],
      [],
      () => `bulk-${nextId += 1}`,
    );

    expect(additions).toHaveLength(2);
    expect(additions.every((food) => food.inStock === false)).toBe(true);
    expect(additions.map((food) => food.referenceFoodId)).toEqual(["salmon", "courgette"]);
    expect(additions[0].referenceSourceId).toBe(salmon.referenceSourceId);

    additions[0].nutrition.calories = 999;
    additions[0].tags.push("freezer");
    expect(salmon.nutrition.calories).not.toBe(999);
    expect(salmon.tags).not.toContain("freezer");
  });

  it("skips existing and repeated references instead of silently duplicating them", () => {
    const existing = createUserFoodFromReference(salmon, { id: "existing-salmon" });
    const additions = createUserFoodsFromReferences(
      [salmon, courgette, courgette],
      [existing],
      () => "bulk-courgette",
    );

    expect(additions).toHaveLength(1);
    expect(additions[0].referenceFoodId).toBe("courgette");
  });
});
