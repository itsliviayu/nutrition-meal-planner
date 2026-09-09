import { describe, expect, it } from "vitest";
import { createUserFoodFromReference, findReferenceDuplicate } from "./foodFactory";
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
