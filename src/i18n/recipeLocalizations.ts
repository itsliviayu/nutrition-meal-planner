import type { RecipeInstructionStep } from "../types";
import type { Locale } from "./translations";

interface RecipeTemplateLocalization {
  name: string;
  suffix: string;
  ingredientSlotIds?: string[];
  instructions: RecipeInstructionStep[];
}

export const recipeTemplateZh: Record<string, RecipeTemplateLocalization> = {
  "eggs-toast-plate": {
    name: "鸡蛋吐司餐盘",
    suffix: "吐司",
    instructions: [
      { text: "将{eggs}加热至凝固并完全熟透。" },
      { text: "按喜好烤好{toast}。" },
      { text: "处理好{vegetable}，放入餐盘。", whenSlotsPresent: ["vegetable"] },
      { text: "将所有食材一起装盘，可按口味简单调味。" },
    ],
  },
  "yogurt-bowl": {
    name: "酸奶碗",
    suffix: "碗",
    ingredientSlotIds: ["fruit", "yogurt"],
    instructions: [
      { text: "将{yogurt}放入碗中。" },
      { text: "处理好{fruit}，铺在酸奶上。" },
      { text: "最后加入{topping}。", whenSlotsPresent: ["topping"] },
      { text: "轻轻拌匀即可，无需烹饪。" },
    ],
  },
  "oat-bowl": {
    name: "燕麦碗",
    suffix: "燕麦碗",
    instructions: [
      { text: "按照包装说明煮熟或加热{oats}。" },
      { text: "加入{protein}，搅拌均匀。" },
      { text: "处理好{fruit}并放在上面。", whenSlotsPresent: ["fruit"] },
      { text: "趁热享用。" },
    ],
  },
  "savoury-toast": {
    name: "咸味吐司",
    suffix: "吐司",
    instructions: [
      { text: "将{toast}烤至酥脆。" },
      { text: "处理好{protein}；如需加热，请确保完全熟透。" },
      { text: "处理好{vegetable}并放到吐司上。", whenSlotsPresent: ["vegetable"] },
      { text: "把{protein}放在吐司上，可按口味简单调味后享用。" },
    ],
  },
  "quick-breakfast-plate": {
    name: "快手早餐餐盘",
    suffix: "早餐餐盘",
    instructions: [
      { text: "根据需要处理好{quick-items}，确保每样食材都可直接食用。" },
      { text: "将所有食材装盘即可。" },
    ],
  },
  pasta: {
    name: "意面",
    suffix: "意面",
    instructions: [
      { text: "按照包装说明煮熟{pasta}。" },
      { text: "处理并烹调{protein}，确保完全熟透。" },
      { text: "加入{vegetable}，翻炒至变软。" },
      { text: "加入{sauce}，拌匀。", whenSlotsPresent: ["sauce"] },
      { text: "加入煮好的{pasta}，拌匀后即可食用。" },
    ],
  },
  "rice-bowl": {
    name: "米饭碗",
    suffix: "饭",
    instructions: [
      { text: "按照包装说明煮熟或加热{rice}。" },
      { text: "处理并烹调{protein}，确保完全熟透。" },
      { text: "加入{vegetable}，翻炒或加热至变软。" },
      { text: "加入{sauce}，拌匀。", whenSlotsPresent: ["sauce"] },
      { text: "将食材铺在{rice}上即可。" },
    ],
  },
  "stir-fry": {
    name: "快炒",
    suffix: "快炒",
    instructions: [
      { text: "按照包装说明煮熟或加热{base}。" },
      { text: "处理并烹调{protein}，确保完全熟透。" },
      { text: "加入{vegetable}，用大火翻炒至变软。" },
      { text: "加入{sauce}，翻炒均匀。", whenSlotsPresent: ["sauce"] },
      { text: "搭配{base}装盘，可按口味简单调味。" },
    ],
  },
  "oven-tray-meal": {
    name: "烤盘餐",
    suffix: "烤盘餐",
    instructions: [
      { text: "预热烤箱，处理好{protein}、{potato}和{vegetable}。" },
      { text: "把所有食材均匀铺在烤盘上。" },
      { text: "加入{oil}并轻轻拌匀。", whenSlotsPresent: ["oil"] },
      { text: "烤至所有食材熟透，按需翻动一次。" },
      { text: "可按口味简单调味后享用。" },
    ],
  },
  wrap: {
    name: "卷饼",
    suffix: "卷饼",
    instructions: [
      { text: "处理好{protein}；如需加热，请确保完全熟透。" },
      { text: "处理好{vegetable}。" },
      { text: "在{wrap}上铺好{protein}和{vegetable}。" },
      { text: "加入{sauce}。", whenSlotsPresent: ["sauce"] },
      { text: "卷紧后即可食用。" },
    ],
  },
  "potato-plate": {
    name: "土豆餐盘",
    suffix: "土豆餐盘",
    ingredientSlotIds: ["protein"],
    instructions: [
      { text: "将{potato}加热至完全熟透。" },
      { text: "处理并烹调{protein}，确保完全熟透。" },
      { text: "处理好{vegetable}并加热至合适口感。" },
      { text: "加入{sauce}。", whenSlotsPresent: ["sauce"] },
      { text: "把所有食材装盘，可按口味简单调味。" },
    ],
  },
  "yogurt-snack": {
    name: "酸奶加餐",
    suffix: "酸奶加餐",
    ingredientSlotIds: ["fruit", "yogurt"],
    instructions: [
      { text: "将{yogurt}放入碗中。" },
      { text: "处理好{fruit}并放在上面。", whenSlotsPresent: ["fruit"] },
      { text: "轻轻拌匀即可，无需烹饪。" },
    ],
  },
  "egg-snack": {
    name: "鸡蛋加餐",
    suffix: "加餐",
    instructions: [
      { text: "将{egg}加热至凝固并完全熟透。" },
      { text: "清洗并处理好{produce}。", whenSlotsPresent: ["produce"] },
      { text: "一起装盘，可按口味简单调味。" },
    ],
  },
  "fruit-protein-snack": {
    name: "水果蛋白加餐",
    suffix: "加餐",
    instructions: [
      { text: "根据需要处理好{protein}，确保可以直接食用。" },
      { text: "处理好{fruit}，与{protein}一起装盘。" },
      { text: "即可食用，无需添加其他食材。" },
    ],
  },
};

export const getRecipeTemplateDisplayName = (
  templateId: string,
  fallback: string,
  locale: Locale,
): string => locale === "zh-CN" ? recipeTemplateZh[templateId]?.name ?? fallback : fallback;
