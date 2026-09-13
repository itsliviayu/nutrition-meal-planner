import { describe, expect, it } from "vitest";
import { createUserFoodFromReference } from "../data/foodFactory";
import { recipeTemplates } from "../data/recipeTemplates";
import { referenceFoods } from "../data/referenceFoods";
import { searchReferenceFoods } from "../data/referenceFoodSearch";
import type { Food } from "../types";
import { referenceFoodNamesZh } from "./foodNames";
import { formatTodayDate, getFoodDisplayName, getReferenceDisplayName, translate } from "./locale";
import { recipeTemplateZh } from "./recipeLocalizations";
import { translations } from "./translations";

describe("localization display layer", () => {
  it("keeps the English and Chinese translation keys in sync", () => {
    expect(Object.keys(translations["zh-CN"]).sort()).toEqual(Object.keys(translations.en).sort());
  });

  it("uses English for core UI labels when locale is en", () => {
    expect(translate("en", "nav.today")).toBe("Today");
    expect(translate("en", "today.planFreely")).toBe("Plan Freely");
    expect(translate("en", "meal.regenerate")).toBe("Regenerate");
  });

  it("uses natural Chinese for core UI labels when locale is zh-CN", () => {
    expect(translate("zh-CN", "nav.today")).toBe("今天");
    expect(translate("zh-CN", "today.planFreely")).toBe("自由规划");
    expect(translate("zh-CN", "meal.regenerate")).toBe("换一份");
  });

  it("covers all 161 Reference Foods with Chinese display names", () => {
    expect(referenceFoods).toHaveLength(161);
    expect(Object.keys(referenceFoodNamesZh)).toHaveLength(161);
    for (const food of referenceFoods) {
      expect(referenceFoodNamesZh[food.id as keyof typeof referenceFoodNamesZh]).toBeTruthy();
      expect(getReferenceDisplayName(food, "zh-CN")).not.toBe(food.name);
    }
  });

  it("localizes a reference-linked User Food", () => {
    const reference = referenceFoods.find((food) => food.id === "chicken-breast")!;
    const userFood = createUserFoodFromReference(reference, { id: "user-chicken" });

    expect(getFoodDisplayName(userFood, "zh-CN")).toBe("鸡胸肉");
    expect(getFoodDisplayName(userFood, "en")).toBe("Chicken Breast");
  });

  it("preserves the exact name of a user-created custom Food", () => {
    const reference = referenceFoods.find((food) => food.id === "chicken-breast")!;
    const userFood = createUserFoodFromReference(reference, { id: "user-chicken" });
    const customFood: Food = {
      ...userFood,
      id: "custom-food",
      name: "妈妈的番茄酱",
      referenceFoodId: undefined,
      nutritionSource: "manual_estimate",
    };

    expect(getFoodDisplayName(customFood, "zh-CN")).toBe("妈妈的番茄酱");
    expect(getFoodDisplayName(customFood, "en")).toBe("妈妈的番茄酱");
  });

  it("finds Reference Foods by Chinese or English text in Chinese mode", () => {
    expect(searchReferenceFoods("西兰", "zh-CN").map((food) => food.id)).toContain("broccoli");
    expect(searchReferenceFoods("chicken", "zh-CN").map((food) => food.id)).toContain("chicken-breast");
  });

  it("covers all 14 Recipe Templates with Chinese display metadata", () => {
    expect(recipeTemplates).toHaveLength(14);
    expect(Object.keys(recipeTemplateZh).sort()).toEqual(recipeTemplates.map((template) => template.id).sort());
  });

  it("formats dates through Intl for the active locale", () => {
    expect(formatTodayDate("2026-09-12", "zh-CN")).toContain("星期六");
    expect(formatTodayDate("2026-09-12", "en")).toContain("Saturday");
  });

  it("provides Chinese Shopping labels and actions", () => {
    expect(translate("zh-CN", "shop.list")).toBe("购物清单");
    expect(translate("zh-CN", "shop.stockUp")).toBe("常备补货");
    expect(translate("zh-CN", "shop.discover")).toBe("发现新食材");
    expect(translate("zh-CN", "shop.markBought")).toBe("标记为已购买");
    expect(translate("en", "shop.planNeeded")).toBe("Needed for Your Plan");
    expect(translate("en", "shop.stockUp")).toBe("Stock Up");
    expect(translate("en", "shop.discover")).toBe("Discover New Foods");
  });

  it("provides distinct bilingual empty states for plan needs", () => {
    expect(translate("zh-CN", "shop.planNotGenerated")).toContain("生成今日计划后");
    expect(translate("zh-CN", "shop.planAllStocked")).toBe("当前计划所需食材都已备齐。");
    expect(translate("en", "shop.planNotGenerated")).toContain("Generate today’s plan");
    expect(translate("en", "shop.planAllStocked")).toBe("You already have everything needed for this plan.");
  });

  it("keeps the Chinese partial-fibre message explicit", () => {
    expect(translate("zh-CN", "nutrition.partialDetail")).toBe("部分食材缺少膳食纤维数据");
  });
});
