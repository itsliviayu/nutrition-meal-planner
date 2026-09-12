import { cookingTechniques } from "../data/cookingTechniques";
import { getFoodDisplayName, type Locale } from "../i18n/locale";
import type {
  CookingTechnique,
  CookingTechniqueId,
  Equipment,
  Food,
  MealType,
  RecipeTemplate,
} from "../types";

const identities = (food: Food): string[] => [food.id, food.referenceFoodId].filter(Boolean) as string[];
const hasIdentity = (food: Food, ids: string[]): boolean => identities(food).some((id) => ids.includes(id));
const hasAnyIdentity = (foods: Food[], ids: string[] = []): boolean => foods.some((food) => hasIdentity(food, ids));

const eggIds = ["egg"];
const dairyBowlIds = ["greek-yogurt", "skyr", "cottage-cheese"];
const breadIds = ["wholemeal-toast", "white-bread", "bagel"];
const pastaIds = ["pasta", "wholewheat-pasta"];
const riceIds = ["white-rice", "brown-rice"];
const boilableCarbIds = [...pastaIds, ...riceIds, "egg-noodles", "potato", "sweet-potato", "couscous"];
const panExcludedProteinIds = [...dairyBowlIds, "egg", "tuna-spring-water"];

const allCategoriesAllowed = (technique: CookingTechnique, foods: Food[]): boolean =>
  !technique.allowedCategories || foods.every((food) => technique.allowedCategories!.includes(food.category));

const includesRequiredCategories = (technique: CookingTechnique, foods: Food[]): boolean =>
  (technique.requiredCategories ?? []).every((category) => foods.some((food) => food.category === category));

const matchesTechniqueRule = (technique: CookingTechnique, foods: Food[]): boolean => {
  const proteins = foods.filter((food) => food.category === "protein");
  const vegetables = foods.filter((food) => food.category === "vegetable");
  switch (technique.rule) {
    case "egg_cook":
      return hasAnyIdentity(foods, eggIds)
        && proteins.every((food) => hasIdentity(food, eggIds));
    case "pan_cook":
      return proteins.some((food) => !hasIdentity(food, panExcludedProteinIds));
    case "stir_fry":
      return vegetables.length > 0
        && proteins.some((food) => !hasIdentity(food, dairyBowlIds));
    case "carb_assemble":
      return hasAnyIdentity(foods, boilableCarbIds);
    case "toast_topping":
      return hasAnyIdentity(foods, breadIds) && foods.some((food) => !hasIdentity(food, breadIds));
    case "cold_assemble":
      return foods.every((food) => food.category === "fruit"
        || food.tags.includes("no_cook")
        || hasIdentity(food, [...breadIds, "tortilla-wrap"]));
    case "oven_roast":
      return foods.filter((food) => food.category !== "fat_sauce")
        .every((food) => food.tags.includes("oven") || hasIdentity(food, ["potato", "sweet-potato"]));
    case "pasta":
      return hasAnyIdentity(foods, pastaIds);
    case "rice":
      return hasAnyIdentity(foods, riceIds);
    case "wrap":
      return hasAnyIdentity(foods, ["tortilla-wrap"]);
    case "yogurt":
      return hasAnyIdentity(foods, dairyBowlIds);
    case "oats":
      return hasAnyIdentity(foods, ["oats"]);
    default:
      return false;
  }
};

export interface TechniqueCompatibilityInput {
  blueprint: RecipeTemplate;
  mealType: MealType;
  foods: Food[];
  allowedEquipment?: Equipment[];
  maxCookingTime?: number;
}

export const isTechniqueCompatible = (
  technique: CookingTechnique,
  { blueprint, mealType, foods, allowedEquipment, maxCookingTime }: TechniqueCompatibilityInput,
): boolean => technique.supportedMealTypes.includes(mealType)
  && (!technique.compatibleBlueprintIds || technique.compatibleBlueprintIds.includes(blueprint.id))
  && foods.length >= technique.minIngredients
  && foods.length <= technique.maxIngredients
  && (maxCookingTime === undefined || technique.cookingTime <= maxCookingTime)
  && (!allowedEquipment || technique.requiredEquipment.every((item) => allowedEquipment.includes(item)))
  && allCategoriesAllowed(technique, foods)
  && includesRequiredCategories(technique, foods)
  && (!technique.requiredAnyFoodIds || hasAnyIdentity(foods, technique.requiredAnyFoodIds))
  && (!technique.requiredAllFoodIds || technique.requiredAllFoodIds.every((id) => hasAnyIdentity(foods, [id])))
  && (!technique.excludedFoodIds || !hasAnyIdentity(foods, technique.excludedFoodIds))
  && matchesTechniqueRule(technique, foods);

export const getCompatibleTechniques = (
  input: TechniqueCompatibilityInput,
  techniques: CookingTechnique[] = cookingTechniques,
): CookingTechnique[] => techniques.filter((technique) => isTechniqueCompatible(technique, input));

const preferredTechniqueByBlueprint: Record<string, CookingTechniqueId> = {
  "eggs-toast-plate": "scramble",
  "yogurt-bowl": "yogurt_bowl",
  "oat-bowl": "oat_bowl",
  "savoury-toast": "toast_topping",
  "quick-breakfast-plate": "cold_assemble",
  pasta: "pasta_toss",
  "rice-bowl": "rice_bowl_assemble",
  "stir-fry": "stir_fry",
  "oven-tray-meal": "oven_roast",
  wrap: "wrap_fill",
  "potato-plate": "boil_and_assemble",
  "yogurt-snack": "yogurt_bowl",
  "egg-snack": "scramble",
  "fruit-protein-snack": "cold_assemble",
};

export const selectDefaultTechnique = (
  compatible: CookingTechnique[],
  blueprintId: string,
): CookingTechnique | undefined => {
  const preferred = preferredTechniqueByBlueprint[blueprintId];
  return compatible.find((technique) => technique.id === preferred) ?? compatible[0];
};

const readableEnglishName = (food: Food): string => getFoodDisplayName(food, "en")
  .split(",")[0]
  .replace(/\bchicken breast\b/gi, "Chicken")
  .replace(/\btuna in spring water\b/gi, "Tuna")
  .replace(/\bfillets?\b/gi, "")
  .replace(/\s+/g, " ")
  .trim();

const readableChineseName = (food: Food): string => getFoodDisplayName(food, "zh-CN")
  .replace("鸡胸肉", "鸡肉")
  .replace("三文鱼柳", "三文鱼")
  .replace("鳕鱼柳", "鳕鱼")
  .replace("大虾仁", "虾仁")
  .replace("全麦面包", "全麦吐司")
  .replace("白面包", "白吐司");

const displayName = (food: Food, locale: Locale): string => locale === "zh-CN"
  ? readableChineseName(food)
  : readableEnglishName(food);
const instructionName = (food: Food, locale: Locale): string => locale === "zh-CN"
  ? getFoodDisplayName(food, locale)
  : readableEnglishName(food).toLocaleLowerCase("en-GB");

const joinNames = (foods: Food[], locale: Locale): string => {
  const names = foods.map((food) => displayName(food, locale));
  if (locale === "zh-CN") return names.join("和");
  if (names.length < 2) return names[0] ?? "";
  return names.length === 2 ? `${names[0]} & ${names[1]}` : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
};

const byCategory = (foods: Food[], category: Food["category"]): Food[] =>
  foods.filter((food) => food.category === category);
const withoutIds = (foods: Food[], ids: string[]): Food[] => foods.filter((food) => !hasIdentity(food, ids));

export interface TechniqueRecipeContent {
  name: string;
  instructions: string[];
}

export const buildTechniqueRecipe = (
  technique: CookingTechnique,
  foods: Food[],
  locale: Locale,
): TechniqueRecipeContent => {
  const protein = byCategory(foods, "protein");
  const vegetables = byCategory(foods, "vegetable");
  const fruit = byCategory(foods, "fruit");
  const carbs = byCategory(foods, "carb");
  const sauces = byCategory(foods, "fat_sauce");
  const egg = foods.find((food) => hasIdentity(food, eggIds));
  const toast = foods.find((food) => hasIdentity(food, breadIds));
  const pasta = foods.find((food) => hasIdentity(food, pastaIds));
  const rice = foods.find((food) => hasIdentity(food, riceIds));
  const wrap = foods.find((food) => hasIdentity(food, ["tortilla-wrap"]));
  const yogurt = foods.find((food) => hasIdentity(food, dairyBowlIds));
  const oats = foods.find((food) => hasIdentity(food, ["oats"]));
  const leadProtein = protein.find((food) => !hasIdentity(food, [...dairyBowlIds, ...eggIds])) ?? protein[0];
  const sideCarbs = carbs.filter((food) => food !== pasta && food !== rice && food !== wrap && food !== oats);
  const sideText = (items: Food[]) => items.length ? joinNames(items, locale) : "";
  const names = (items: Food[]) => items.map((food) => instructionName(food, locale));
  const joinedInstructions = (items: Food[]) => locale === "zh-CN"
    ? names(items).join("和")
    : names(items).length === 2 ? names(items).join(" and ") : names(items).join(", ");

  if (technique.id === "scramble" || technique.id === "omelette") {
    const vegetableText = sideText(vegetables);
    const carbText = sideText(sideCarbs);
    const base = locale === "zh-CN"
      ? `${vegetableText}${technique.id === "scramble" ? "炒蛋" : "欧姆蛋"}`
      : `${vegetableText ? `${vegetableText} ` : ""}${technique.id === "scramble" ? "Scrambled Eggs" : "Omelette"}`;
    const name = carbText ? (locale === "zh-CN" ? `${base}配${carbText}` : `${base} with ${carbText}`) : base;
    const instructions = locale === "zh-CN"
      ? [
        ...(vegetables.length ? [`洗净并切好${joinedInstructions(vegetables)}。`] : []),
        `将${instructionName(egg!, locale)}打散。`,
        ...(vegetables.length ? [`用平底锅短暂炒软${joinedInstructions(vegetables)}。`] : []),
        technique.id === "scramble" ? "倒入蛋液，轻轻翻动至刚好凝固。" : "倒入蛋液，煎至大致凝固后对折。",
        ...(sideCarbs.length ? [`准备好${joinedInstructions(sideCarbs)}，与鸡蛋一起享用。`] : ["按口味少量调味后享用。"]),
      ]
      : [
        ...(vegetables.length ? [`Prepare ${joinedInstructions(vegetables)}.`] : []),
        `Beat the ${instructionName(egg!, locale)}.`,
        ...(vegetables.length ? [`Cook ${joinedInstructions(vegetables)} briefly in a pan.`] : []),
        technique.id === "scramble" ? "Add the beaten egg and stir gently until just set." : "Add the beaten egg, cook until mostly set, then fold.",
        ...(sideCarbs.length ? [`Prepare ${joinedInstructions(sideCarbs)} and serve alongside.`] : ["Season lightly to taste and serve."]),
      ];
    return { name, instructions };
  }

  if (technique.id === "toast_topping") {
    const toppings = foods.filter((food) => food !== toast);
    return locale === "zh-CN" ? {
      name: `${sideText(toppings)}开放吐司`,
      instructions: [`将${instructionName(toast!, locale)}烤至喜欢的酥脆程度。`, `按需处理${joinedInstructions(toppings)}。`, "把配料铺在吐司上，按口味少量调味后享用。"],
    } : {
      name: `${sideText(toppings)} Open Toast`,
      instructions: [`Toast the ${instructionName(toast!, locale)} to your liking.`, `Prepare ${joinedInstructions(toppings)} as needed.`, "Arrange the toppings over the toast, season lightly to taste and serve."],
    };
  }

  if (technique.id === "pasta_toss") {
    const additions = withoutIds(foods, pastaIds);
    const titleFoods = [...protein, ...vegetables].slice(0, 2);
    return locale === "zh-CN" ? {
      name: `${titleFoods.map((food) => readableChineseName(food)).join("")}意面`,
      instructions: [`按包装说明煮热${instructionName(pasta!, locale)}。`, ...(leadProtein ? [`将${instructionName(leadProtein, locale)}彻底烹熟。`] : []), ...(vegetables.length ? [`加入${joinedInstructions(vegetables)}，炒至变软。`] : []), ...(sauces.length ? [`加入${joinedInstructions(sauces)}，拌匀。`] : []), `将${joinedInstructions(additions)}与意面拌匀后享用。`],
    } : {
      name: `${joinNames(titleFoods, locale)} Pasta`,
      instructions: [`Cook or heat the ${instructionName(pasta!, locale)} according to the package instructions.`, ...(leadProtein ? [`Cook the ${instructionName(leadProtein, locale)} until cooked through.`] : []), ...(vegetables.length ? [`Add ${joinedInstructions(vegetables)} and cook until tender.`] : []), ...(sauces.length ? [`Stir in ${joinedInstructions(sauces)}.`] : []), `Toss ${joinedInstructions(additions)} with the pasta and serve.`],
    };
  }

  if (technique.id === "rice_bowl_assemble") {
    const toppings = foods.filter((food) => food !== rice);
    const titleFoods = [...protein, ...vegetables].slice(0, 2);
    return locale === "zh-CN" ? {
      name: `${titleFoods.map((food) => readableChineseName(food)).join("")}盖饭`,
      instructions: [`按包装说明准备或加热${instructionName(rice!, locale)}。`, `按需将${joinedInstructions(toppings)}彻底烹熟或处理至可食用。`, "将米饭盛入碗中，铺上其他食材。", ...(sauces.length ? [`最后加入${joinedInstructions(sauces)}。`] : [])],
    } : {
      name: `${joinNames(titleFoods, locale)} Rice Bowl`,
      instructions: [`Prepare or heat the ${instructionName(rice!, locale)} according to the package instructions.`, `Cook or prepare ${joinedInstructions(toppings)} until ready to eat.`, "Add the rice to a bowl and arrange the other ingredients on top.", ...(sauces.length ? [`Finish with ${joinedInstructions(sauces)}.`] : [])],
    };
  }

  if (technique.id === "stir_fry") {
    const titleFoods = [...vegetables, ...protein].slice(0, 2);
    const servingCarbs = carbs.filter((food) => !hasIdentity(food, ["egg-noodles"]));
    return locale === "zh-CN" ? {
      name: `${titleFoods.map((food) => readableChineseName(food)).join("")}快炒${servingCarbs.length ? `配${sideText(servingCarbs)}` : ""}`,
      instructions: [`切好${joinedInstructions([...protein, ...vegetables])}。`, `先将${joinedInstructions(protein)}炒至接近熟透。`, `加入${joinedInstructions(vegetables)}，快速翻炒至变软。`, ...(sauces.length ? [`加入${joinedInstructions(sauces)}拌匀。`] : []), ...(servingCarbs.length ? [`与${joinedInstructions(servingCarbs)}一起享用。`] : ["按口味少量调味后享用。"])],
    } : {
      name: `${joinNames(titleFoods, locale)} Stir-fry${servingCarbs.length ? ` with ${sideText(servingCarbs)}` : ""}`,
      instructions: [`Prepare ${joinedInstructions([...protein, ...vegetables])}.`, `Cook ${joinedInstructions(protein)} in a hot pan until nearly cooked through.`, `Add ${joinedInstructions(vegetables)} and stir-fry until tender.`, ...(sauces.length ? [`Stir through ${joinedInstructions(sauces)}.`] : []), ...(servingCarbs.length ? [`Serve with ${joinedInstructions(servingCarbs)}.`] : ["Season lightly to taste and serve."])],
    };
  }

  if (technique.id === "pan_sear") {
    const sides = foods.filter((food) => food !== leadProtein && !sauces.includes(food));
    return locale === "zh-CN" ? {
      name: `香煎${displayName(leadProtein!, locale)}配${sideText(sides)}`,
      instructions: [`准备好${instructionName(leadProtein!, locale)}和${joinedInstructions(sides)}。`, `用热锅将${instructionName(leadProtein!, locale)}煎至彻底熟透。`, `将${joinedInstructions(sides)}分别处理至可食用。`, ...(sauces.length ? [`搭配${joinedInstructions(sauces)}享用。`] : ["按口味少量调味后装盘。"])],
    } : {
      name: `Pan-seared ${displayName(leadProtein!, locale)} with ${sideText(sides)}`,
      instructions: [`Prepare the ${instructionName(leadProtein!, locale)} and ${joinedInstructions(sides)}.`, `Cook the ${instructionName(leadProtein!, locale)} in a hot pan until cooked through.`, `Prepare ${joinedInstructions(sides)} until ready to eat.`, ...(sauces.length ? [`Serve with ${joinedInstructions(sauces)}.`] : ["Season lightly to taste and plate."])],
    };
  }

  if (technique.id === "oven_roast") {
    const main = foods.filter((food) => !sauces.includes(food));
    return locale === "zh-CN" ? {
      name: `${sideText(main.slice(0, 2))}烤盘餐`,
      instructions: [`预热烤箱并处理好${joinedInstructions(main)}。`, "将食材均匀铺在烤盘上。", ...(sauces.length ? [`加入${joinedInstructions(sauces)}。`] : []), "烤至蛋白质完全熟透、蔬菜和根茎变软。", "按口味少量调味后享用。"],
    } : {
      name: `${sideText(main.slice(0, 2))} Tray Roast`,
      instructions: [`Heat the oven and prepare ${joinedInstructions(main)}.`, "Arrange the ingredients evenly on a baking tray.", ...(sauces.length ? [`Add ${joinedInstructions(sauces)}.`] : []), "Roast until the protein is cooked through and the vegetables are tender.", "Season lightly to taste and serve."],
    };
  }

  if (technique.id === "wrap_fill") {
    const filling = foods.filter((food) => food !== wrap);
    return locale === "zh-CN" ? {
      name: `${sideText(filling.slice(0, 2))}卷饼`,
      instructions: [`按需将${joinedInstructions(filling)}彻底烹熟或处理至可食用。`, `摊开${instructionName(wrap!, locale)}，放入馅料。`, "卷紧后切开享用。"],
    } : {
      name: `${sideText(filling.slice(0, 2))} Wrap`,
      instructions: [`Cook or prepare ${joinedInstructions(filling)} until ready to eat.`, `Lay out the ${instructionName(wrap!, locale)} and add the filling.`, "Roll tightly, slice and serve."],
    };
  }

  if (technique.id === "yogurt_bowl") {
    const toppings = foods.filter((food) => food !== yogurt);
    return locale === "zh-CN" ? {
      name: `${fruit.map((food) => readableChineseName(food)).join("")}${readableChineseName(yogurt!)}碗`,
      instructions: [`将${instructionName(yogurt!, locale)}盛入碗中。`, ...(toppings.length ? [`处理好${joinedInstructions(toppings)}并铺在上面。`] : []), "轻轻组合后享用，无需烹饪。"],
    } : {
      name: `${joinNames([yogurt!, ...fruit].slice(0, 2), locale)} Bowl`,
      instructions: [`Spoon the ${instructionName(yogurt!, locale)} into a bowl.`, ...(toppings.length ? [`Prepare ${joinedInstructions(toppings)} and add on top.`] : []), "Combine gently and serve. No cooking required."],
    };
  }

  if (technique.id === "oat_bowl") {
    const additions = foods.filter((food) => food !== oats);
    return locale === "zh-CN" ? {
      name: `${sideText(fruit)}燕麦碗`,
      instructions: [`加少量水，按包装说明煮熟${instructionName(oats!, locale)}。`, ...(additions.length ? [`拌入或铺上${joinedInstructions(additions)}。`] : []), "趁温热享用。"],
    } : {
      name: `${sideText(fruit)} Oat Bowl`.trim(),
      instructions: [`Cook the ${instructionName(oats!, locale)} with a little water according to the package instructions.`, ...(additions.length ? [`Stir in or top with ${joinedInstructions(additions)}.`] : []), "Serve warm."],
    };
  }

  if (technique.id === "boil_and_assemble") {
    const base = foods.find((food) => hasIdentity(food, boilableCarbIds))!;
    const additions = foods.filter((food) => food !== base);
    return locale === "zh-CN" ? {
      name: `${sideText(additions.slice(0, 2))}配${displayName(base, locale)}`,
      instructions: [`按包装说明煮热${instructionName(base, locale)}。`, `按需将${joinedInstructions(additions)}彻底烹熟或处理至可食用。`, "将所有食材组合装盘，按口味少量调味。"],
    } : {
      name: `${sideText(additions.slice(0, 2))} with ${displayName(base, locale)}`,
      instructions: [`Cook or heat the ${instructionName(base, locale)} according to the package instructions.`, `Cook or prepare ${joinedInstructions(additions)} until ready to eat.`, "Assemble everything on a plate and season lightly to taste."],
    };
  }

  const coldFoods = foods;
  return locale === "zh-CN" ? {
    name: `${sideText(coldFoods.slice(0, 2))}${foods.length === 1 ? "" : "组合"}`,
    instructions: [`按需清洗、切分或准备${joinedInstructions(coldFoods)}。`, "组合装盘后即可享用，无需烹饪。"],
  } : {
    name: `${sideText(coldFoods.slice(0, 2))}${foods.length === 1 ? "" : " Plate"}`,
    instructions: [`Wash, slice or prepare ${joinedInstructions(coldFoods)} as needed.`, "Arrange together and serve. No cooking required."],
  };
};
