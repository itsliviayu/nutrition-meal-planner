import type {
  FoodCategory,
  FoodTag,
  MealType,
  Nutrition,
  NutritionBasis,
  ReferenceFood,
  ServingUnit,
} from "../types";

const COFID_SOURCE_NAME = "UK CoFID 2021";
const COFID_SOURCE_URL =
  "https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid";

interface ReferenceFoodInput {
  id: string;
  name: string;
  aliases?: string[];
  category: FoodCategory;
  referenceSourceId: string;
  referenceSourceName?: string;
  referenceSourceUrl?: string;
  nutrition: Nutrition;
  defaultServing: number;
  servingUnit?: ServingUnit;
  nutritionBasis?: NutritionBasis;
  gramsPerUnit?: number;
  tags?: FoodTag[];
  compatibleMeals?: MealType[];
}

const categoryDefaults: Record<
  FoodCategory,
  { tags: FoodTag[]; compatibleMeals: MealType[] }
> = {
  protein: { tags: ["high_protein", "lunch", "savoury"], compatibleMeals: ["lunch"] },
  carb: { tags: ["lunch", "vegetarian", "savoury"], compatibleMeals: ["lunch"] },
  vegetable: { tags: ["lunch", "vegetarian", "savoury"], compatibleMeals: ["lunch"] },
  fruit: { tags: ["quick", "breakfast", "snack", "vegetarian", "sweet", "no_cook"], compatibleMeals: ["breakfast", "snack"] },
  fat_sauce: { tags: ["quick", "lunch", "vegetarian"], compatibleMeals: ["lunch"] },
  composite: { tags: ["quick", "lunch", "savoury"], compatibleMeals: ["lunch"] },
};

const referenceFood = ({
  aliases = [],
  servingUnit = "g",
  nutritionBasis = "per_100g",
  referenceSourceName = COFID_SOURCE_NAME,
  referenceSourceUrl = COFID_SOURCE_URL,
  tags,
  compatibleMeals,
  ...food
}: ReferenceFoodInput): ReferenceFood => ({
  ...food,
  aliases: [...aliases],
  servingUnit,
  nutritionBasis,
  inStock: false,
  regularBuy: false,
  favourite: false,
  nutritionSource: "reference",
  fibreSourceMethod: food.nutrition.fibre === undefined ? undefined : "AOAC",
  estimatedNutrition: true,
  referenceSourceName,
  referenceSourceUrl,
  tags: [...(tags ?? categoryDefaults[food.category].tags)],
  compatibleMeals: [...(compatibleMeals ?? categoryDefaults[food.category].compatibleMeals)],
});

// CoFID publishes these nutrients per 100g. Only AOAC fibre is mapped to the
// shared fibre field; unavailable AOAC values remain undefined. CoFID trace
// values are represented as zero because the remaining nutrients are numeric.
export const referenceFoods: ReferenceFood[] = [
  // Protein (20)
  referenceFood({ id: "egg", name: "Egg", aliases: ["eggs", "chicken egg"], category: "protein", referenceSourceId: "12-937", nutrition: { calories: 131, protein: 12.6, carbs: 0, fat: 9, fibre: 0, sugar: 0, saturatedFat: 2.52 }, defaultServing: 100, tags: ["high_protein", "quick", "breakfast", "lunch", "snack", "vegetarian", "savoury", "hob"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "greek-yogurt", name: "Greek Yogurt", aliases: ["greek yoghurt", "greek-style yogurt", "greek-style yoghurt"], category: "protein", referenceSourceId: "12-555", nutrition: { calories: 133, protein: 5.7, carbs: 4.8, fat: 10.2, fibre: 0, sugar: 4.5, saturatedFat: 6.75 }, defaultServing: 150, tags: ["quick", "breakfast", "snack", "vegetarian", "no_cook"], compatibleMeals: ["breakfast", "snack"] }),
  referenceFood({ id: "skyr", name: "Plain Skyr", aliases: ["skyr", "icelandic yogurt", "icelandic yoghurt"], category: "protein", referenceSourceId: "2664809", referenceSourceName: "USDA FoodData Central", referenceSourceUrl: "https://fdc.nal.usda.gov/food-details/2664809/nutrients", nutrition: { calories: 73, protein: 11.3, carbs: 4, fat: 1.33, sugar: 4, saturatedFat: 0.67 }, defaultServing: 150, tags: ["high_protein", "quick", "breakfast", "snack", "vegetarian", "no_cook"], compatibleMeals: ["breakfast", "snack"] }),
  referenceFood({ id: "chicken-breast", name: "Chicken Breast", aliases: ["chicken breasts", "grilled chicken breast"], category: "protein", referenceSourceId: "18-323", nutrition: { calories: 148, protein: 32, carbs: 0, fat: 2.2, fibre: 0, sugar: 0, saturatedFat: 0.6 }, defaultServing: 140, tags: ["high_protein", "lunch", "savoury", "hob", "oven"] }),
  referenceFood({ id: "chicken-thigh", name: "Chicken Thigh", aliases: ["chicken thighs"], category: "protein", referenceSourceId: "18-319", nutrition: { calories: 180, protein: 25.6, carbs: 0, fat: 8.6, sugar: 0, saturatedFat: 2.4 }, defaultServing: 140, tags: ["high_protein", "lunch", "savoury", "hob", "oven"] }),
  referenceFood({ id: "lean-beef", name: "Extra Lean Beef Mince", aliases: ["lean beef mince", "ground beef", "minced beef"], category: "protein", referenceSourceId: "18-508", nutrition: { calories: 130, protein: 21.9, carbs: 0, fat: 4.2, sugar: 0, saturatedFat: 2.08 }, defaultServing: 125, tags: ["high_protein", "lunch", "savoury", "hob"] }),
  referenceFood({ id: "salmon", name: "Salmon Fillet", aliases: ["salmon", "salmon fillets"], category: "protein", referenceSourceId: "16-356", nutrition: { calories: 217, protein: 20.4, carbs: 0, fat: 15, fibre: 0.2, sugar: 0, saturatedFat: 2.77 }, defaultServing: 130, tags: ["high_protein", "lunch", "savoury", "hob", "oven"] }),
  referenceFood({ id: "tuna", name: "Tuna, Canned in Brine", aliases: ["tuna", "tinned tuna", "canned tuna"], category: "protein", referenceSourceId: "16-416", nutrition: { calories: 109, protein: 24.9, carbs: 0, fat: 1, fibre: 0, sugar: 0, saturatedFat: 0.3 }, defaultServing: 120, tags: ["high_protein", "quick", "lunch", "snack", "savoury", "no_cook"], compatibleMeals: ["lunch", "snack"] }),
  referenceFood({ id: "tofu", name: "Tofu", aliases: ["firm tofu", "bean curd"], category: "protein", referenceSourceId: "13-570", nutrition: { calories: 73, protein: 8.1, carbs: 0.7, fat: 4.2, sugar: 0.3, saturatedFat: 0.5 }, defaultServing: 150, tags: ["high_protein", "lunch", "vegetarian", "savoury", "hob", "oven"] }),
  referenceFood({ id: "turkey-breast", name: "Turkey Breast", aliases: ["turkey breast fillet", "turkey fillet"], category: "protein", referenceSourceId: "18-356", nutrition: { calories: 155, protein: 35, carbs: 0, fat: 1.7, fibre: 0, sugar: 0, saturatedFat: 0.6 }, defaultServing: 140 }),
  referenceFood({ id: "pork-loin", name: "Pork Loin", aliases: ["pork loin medallions", "pork medallions"], category: "protein", referenceSourceId: "18-518", nutrition: { calories: 116, protein: 24.8, carbs: 0, fat: 1.9, fibre: 0, sugar: 0, saturatedFat: 0.65 }, defaultServing: 140 }),
  referenceFood({ id: "cod", name: "Cod Fillet", aliases: ["cod", "cod fillets"], category: "protein", referenceSourceId: "16-372", nutrition: { calories: 75, protein: 17.5, carbs: 0, fat: 0.6, fibre: 0, sugar: 0, saturatedFat: 0.16 }, defaultServing: 140 }),
  referenceFood({ id: "prawns", name: "King Prawns", aliases: ["prawn", "prawns", "shrimp", "shrimps", "king shrimp"], category: "protein", referenceSourceId: "16-389", nutrition: { calories: 68, protein: 16.2, carbs: 0, fat: 0.4, fibre: 0, sugar: 0, saturatedFat: 0.1 }, defaultServing: 120, tags: ["high_protein", "quick", "lunch", "savoury", "hob"] }),
  referenceFood({ id: "cottage-cheese", name: "Reduced-fat Cottage Cheese", aliases: ["cottage cheese"], category: "protein", referenceSourceId: "12-550", nutrition: { calories: 68, protein: 10.6, carbs: 3.3, fat: 1.5, fibre: 0, sugar: 3.3, saturatedFat: 0.96 }, defaultServing: 150, tags: ["high_protein", "quick", "breakfast", "lunch", "snack", "vegetarian", "no_cook"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "cheddar", name: "Cheddar Cheese", aliases: ["cheddar", "mature cheddar"], category: "protein", referenceSourceId: "12-346", nutrition: { calories: 416, protein: 25.4, carbs: 0.1, fat: 34.9, fibre: 0, sugar: 0.1, saturatedFat: 21.68 }, defaultServing: 30, tags: ["high_protein", "quick", "breakfast", "lunch", "snack", "vegetarian", "no_cook"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "semi-skimmed-milk", name: "Semi-skimmed Milk", aliases: ["semi skimmed milk", "milk"], category: "protein", referenceSourceId: "12-313", nutrition: { calories: 46, protein: 3.5, carbs: 4.7, fat: 1.7, fibre: 0, sugar: 4.7, saturatedFat: 1.07 }, defaultServing: 200, tags: ["quick", "breakfast", "snack", "vegetarian", "no_cook"], compatibleMeals: ["breakfast", "snack"] }),
  referenceFood({ id: "chickpeas", name: "Chickpeas, Canned", aliases: ["chick peas", "garbanzo beans", "canned chickpeas", "tinned chickpeas"], category: "protein", referenceSourceId: "13-670", nutrition: { calories: 129, protein: 8.4, carbs: 18.3, fat: 3, fibre: 7.1, sugar: 0.7, saturatedFat: 0.29 }, defaultServing: 120, tags: ["high_fibre", "lunch", "vegetarian", "savoury", "no_cook"] }),
  referenceFood({ id: "kidney-beans", name: "Kidney Beans, Canned", aliases: ["red kidney beans", "canned kidney beans", "tinned kidney beans"], category: "protein", referenceSourceId: "13-660", nutrition: { calories: 100, protein: 8.6, carbs: 15.1, fat: 1, fibre: 6.8, sugar: 0.8, saturatedFat: 0.2 }, defaultServing: 120, tags: ["high_fibre", "lunch", "vegetarian", "savoury", "no_cook"] }),
  referenceFood({ id: "lentils", name: "Green or Brown Lentils, Cooked", aliases: ["green lentils", "brown lentils", "cooked lentils"], category: "protein", referenceSourceId: "13-661", nutrition: { calories: 92, protein: 7.8, carbs: 14.5, fat: 0.7, fibre: 7.4, sugar: 0.2, saturatedFat: 0.1 }, defaultServing: 150, tags: ["high_fibre", "lunch", "vegetarian", "savoury", "hob"] }),
  referenceFood({ id: "baked-beans", name: "Baked Beans", aliases: ["baked beans in tomato sauce", "tinned baked beans"], category: "protein", referenceSourceId: "13-532", nutrition: { calories: 81, protein: 5, carbs: 15, fat: 0.5, fibre: 4.9, sugar: 4.8, saturatedFat: 0.09 }, defaultServing: 200, tags: ["high_fibre", "quick", "breakfast", "lunch", "vegetarian", "savoury", "hob", "microwave"], compatibleMeals: ["breakfast", "lunch"] }),

  // Carbohydrate (14)
  referenceFood({ id: "brown-rice", name: "Brown Basmati Rice, Cooked", aliases: ["brown rice", "wholegrain rice"], category: "carb", referenceSourceId: "11-867", nutrition: { calories: 131, protein: 3.3, carbs: 28.7, fat: 1.1, fibre: 1.2, sugar: 0.3, saturatedFat: 0.21 }, defaultServing: 150, tags: ["lunch", "vegetarian", "savoury", "hob", "microwave"] }),
  referenceFood({ id: "white-rice", name: "White Basmati Rice, Cooked", aliases: ["rice", "white rice", "basmati rice", "cooked rice"], category: "carb", referenceSourceId: "11-858", nutrition: { calories: 117, protein: 2.8, carbs: 26.5, fat: 0.7, fibre: 0.6, sugar: 0, saturatedFat: 0.16 }, defaultServing: 150, tags: ["lunch", "vegetarian", "savoury", "hob", "microwave"] }),
  referenceFood({ id: "pasta", name: "White Pasta, Cooked", aliases: ["pasta", "spaghetti", "white spaghetti", "cooked pasta"], category: "carb", referenceSourceId: "11-722", nutrition: { calories: 141, protein: 4.4, carbs: 31.5, fat: 0.6, fibre: 1.7, sugar: 1, saturatedFat: 0.09 }, defaultServing: 180, tags: ["lunch", "vegetarian", "savoury", "hob"] }),
  referenceFood({ id: "wholewheat-pasta", name: "Wholewheat Pasta, Cooked", aliases: ["whole wheat pasta", "wholemeal pasta", "wholewheat spaghetti"], category: "carb", referenceSourceId: "11-723", nutrition: { calories: 134, protein: 5.2, carbs: 27.5, fat: 1.1, fibre: 4.2, sugar: 0, saturatedFat: 0.17 }, defaultServing: 180, tags: ["high_fibre", "lunch", "vegetarian", "savoury", "hob"] }),
  referenceFood({ id: "wholemeal-toast", name: "Wholemeal Bread", aliases: ["wholewheat bread", "brown bread", "wholemeal toast", "toast"], category: "carb", referenceSourceId: "11-981", nutrition: { calories: 217, protein: 9.4, carbs: 42, fat: 2.5, fibre: 7, sugar: 2.8, saturatedFat: 0.46 }, defaultServing: 80, tags: ["high_fibre", "quick", "breakfast", "lunch", "snack", "vegetarian", "savoury"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "white-bread", name: "White Bread", aliases: ["white toast", "sliced white bread"], category: "carb", referenceSourceId: "11-1145", nutrition: { calories: 236, protein: 8.7, carbs: 48.7, fat: 2.1, fibre: 2.9, sugar: 3 }, defaultServing: 80, tags: ["quick", "breakfast", "lunch", "snack", "vegetarian", "savoury"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "oats", name: "Porridge Oats", aliases: ["oats", "rolled oats", "oatmeal"], category: "carb", referenceSourceId: "11-792", nutrition: { calories: 352, protein: 11, carbs: 64.6, fat: 7.3, fibre: 8.5, sugar: 0.5, saturatedFat: 1.2 }, defaultServing: 50, tags: ["high_fibre", "quick", "breakfast", "vegetarian", "sweet", "hob", "microwave"], compatibleMeals: ["breakfast"] }),
  referenceFood({ id: "potato", name: "Potato, Boiled", aliases: ["potato", "potatoes", "boiled potato"], category: "carb", referenceSourceId: "13-490", nutrition: { calories: 74, protein: 1.8, carbs: 17.5, fat: 0.1, fibre: 1.6, sugar: 0.8, saturatedFat: 0.03 }, defaultServing: 250, tags: ["lunch", "vegetarian", "savoury", "hob", "microwave"] }),
  referenceFood({ id: "sweet-potato", name: "Sweet Potato, Boiled", aliases: ["sweet potato", "sweet potatoes"], category: "carb", referenceSourceId: "13-646", nutrition: { calories: 58, protein: 1.7, carbs: 13, fat: 0.2, fibre: 2.7, sugar: 9.4, saturatedFat: 0.07 }, defaultServing: 200 }),
  referenceFood({ id: "couscous", name: "Couscous, Cooked", aliases: ["cous cous"], category: "carb", referenceSourceId: "11-902", nutrition: { calories: 178, protein: 7.2, carbs: 37.5, fat: 1, fibre: 2.2, sugar: 1, saturatedFat: 0.18 }, defaultServing: 150 }),
  referenceFood({ id: "quinoa", name: "Quinoa, Dry", aliases: ["raw quinoa", "uncooked quinoa"], category: "carb", referenceSourceId: "14-843", nutrition: { calories: 309, protein: 13.8, carbs: 55.7, fat: 5, fibre: 7, sugar: 6.1, saturatedFat: 0.5 }, defaultServing: 60 }),
  referenceFood({ id: "egg-noodles", name: "Egg Noodles, Cooked", aliases: ["noodles", "cooked noodles"], category: "carb", referenceSourceId: "11-724", nutrition: { calories: 166, protein: 5.8, carbs: 35.7, fat: 1, fibre: 3, sugar: 0, saturatedFat: 0.15 }, defaultServing: 180 }),
  referenceFood({ id: "tortilla-wrap", name: "Wheat Tortilla", aliases: ["tortilla", "wrap", "wraps", "soft tortilla"], category: "carb", referenceSourceId: "11-925", nutrition: { calories: 285, protein: 7.8, carbs: 53.9, fat: 5.7, fibre: 3.6, sugar: 2, saturatedFat: 2.5 }, defaultServing: 60, tags: ["quick", "breakfast", "lunch", "snack", "vegetarian", "savoury"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "bagel", name: "Plain Bagel", aliases: ["bagel", "plain bagels"], category: "carb", referenceSourceId: "11-970", nutrition: { calories: 273, protein: 10, carbs: 57.8, fat: 1.8, fibre: 3, sugar: 4.8 }, defaultServing: 90, tags: ["quick", "breakfast", "lunch", "snack", "vegetarian"], compatibleMeals: ["breakfast", "lunch", "snack"] }),

  // Vegetables (23)
  referenceFood({ id: "broccoli", name: "Broccoli", aliases: ["green broccoli"], category: "vegetable", referenceSourceId: "13-502", nutrition: { calories: 34, protein: 4.3, carbs: 3.2, fat: 0.6, fibre: 4, sugar: 1.9, saturatedFat: 0.15 }, defaultServing: 100, tags: ["high_fibre", "quick", "lunch", "vegetarian", "freezer", "savoury", "hob", "microwave"] }),
  referenceFood({ id: "spinach", name: "Spinach", aliases: ["baby spinach", "spinach leaves"], category: "vegetable", referenceSourceId: "13-521", nutrition: { calories: 16, protein: 2.6, carbs: 0.2, fat: 0.6, fibre: 1, sugar: 0, saturatedFat: 0.08 }, defaultServing: 80, tags: ["quick", "breakfast", "lunch", "vegetarian", "savoury", "no_cook", "hob"], compatibleMeals: ["breakfast", "lunch"] }),
  referenceFood({ id: "mushroom", name: "Mushrooms", aliases: ["mushroom", "white mushrooms", "button mushrooms"], category: "vegetable", referenceSourceId: "13-505", nutrition: { calories: 7, protein: 1, carbs: 0.3, fat: 0.2, fibre: 0.7, sugar: 0.3, saturatedFat: 0.04 }, defaultServing: 100, tags: ["quick", "breakfast", "lunch", "vegetarian", "savoury", "hob", "oven"], compatibleMeals: ["breakfast", "lunch"] }),
  referenceFood({ id: "tomato", name: "Tomato", aliases: ["tomatoes", "salad tomatoes"], category: "vegetable", referenceSourceId: "13-517", nutrition: { calories: 14, protein: 0.5, carbs: 3, fat: 0.1, fibre: 1, sugar: 3, saturatedFat: 0.03 }, defaultServing: 80, tags: ["quick", "breakfast", "lunch", "snack", "vegetarian", "savoury", "no_cook"], compatibleMeals: ["breakfast", "lunch", "snack"] }),
  referenceFood({ id: "mixed-peppers", name: "Red Pepper", aliases: ["red peppers", "bell pepper", "bell peppers", "capsicum", "sweet pepper"], category: "vegetable", referenceSourceId: "13-524", nutrition: { calories: 21, protein: 0.8, carbs: 4.3, fat: 0.2, fibre: 2.2, sugar: 4.2, saturatedFat: 0.05 }, defaultServing: 100, tags: ["quick", "lunch", "vegetarian", "savoury", "no_cook", "hob", "oven"] }),
  referenceFood({ id: "courgette", name: "Courgette", aliases: ["courgettes", "zucchini", "zucchinis"], category: "vegetable", referenceSourceId: "13-627", nutrition: { calories: 16, protein: 1.3, carbs: 2.3, fat: 0.2, fibre: 0.5, sugar: 2.2, saturatedFat: 0.05 }, defaultServing: 100 }),
  referenceFood({ id: "aubergine", name: "Aubergine, Boiled", aliases: ["aubergine", "aubergines", "eggplant", "eggplants"], category: "vegetable", referenceSourceId: "13-651", nutrition: { calories: 14, protein: 0.7, carbs: 1.8, fat: 0.5, fibre: 1.8, sugar: 1.6, saturatedFat: 0.13 }, defaultServing: 120 }),
  referenceFood({ id: "carrot", name: "Carrot", aliases: ["carrots"], category: "vegetable", referenceSourceId: "13-496", nutrition: { calories: 34, protein: 0.5, carbs: 7.7, fat: 0.4, fibre: 3.9, sugar: 7.2, saturatedFat: 0.1 }, defaultServing: 100, tags: ["high_fibre", "lunch", "snack", "vegetarian", "savoury", "no_cook", "hob", "oven"], compatibleMeals: ["lunch", "snack"] }),
  referenceFood({ id: "onion", name: "Onion", aliases: ["onions"], category: "vegetable", referenceSourceId: "13-499", nutrition: { calories: 35, protein: 1, carbs: 8, fat: 0.1, fibre: 2.2, sugar: 6.2, saturatedFat: 0 }, defaultServing: 80 }),
  referenceFood({ id: "spring-onion", name: "Spring Onion", aliases: ["spring onions", "scallion", "scallions", "green onion", "green onions"], category: "vegetable", referenceSourceId: "13-352", nutrition: { calories: 23, protein: 2, carbs: 3, fat: 0.5, sugar: 2.8, saturatedFat: 0.1 }, defaultServing: 30 }),
  referenceFood({ id: "garlic", name: "Garlic", aliases: ["garlic cloves", "garlic clove"], category: "vegetable", referenceSourceId: "13-244", nutrition: { calories: 98, protein: 7.9, carbs: 16.3, fat: 0.6, sugar: 1.6, saturatedFat: 0.1 }, defaultServing: 5 }),
  referenceFood({ id: "cauliflower", name: "Cauliflower", aliases: ["cauliflower florets"], category: "vegetable", referenceSourceId: "13-512", nutrition: { calories: 30, protein: 2.5, carbs: 4.4, fat: 0.4, fibre: 1.8, sugar: 2.9, saturatedFat: 0.09 }, defaultServing: 100 }),
  referenceFood({ id: "white-cabbage", name: "White Cabbage", aliases: ["cabbage", "green cabbage"], category: "vegetable", referenceSourceId: "13-509", nutrition: { calories: 24, protein: 1.2, carbs: 4.8, fat: 0.1, fibre: 3, sugar: 4.8, saturatedFat: 0 }, defaultServing: 100 }),
  referenceFood({ id: "kale", name: "Curly Kale, Cooked", aliases: ["kale", "curly kale"], category: "vegetable", referenceSourceId: "13-649", nutrition: { calories: 26, protein: 2.7, carbs: 1, fat: 1.3, fibre: 3.5, sugar: 0.9, saturatedFat: 0.24 }, defaultServing: 80 }),
  referenceFood({ id: "lettuce", name: "Lettuce", aliases: ["salad leaves"], category: "vegetable", referenceSourceId: "13-520", nutrition: { calories: 11, protein: 1.2, carbs: 1.4, fat: 0.1, fibre: 1.5, sugar: 1.4, saturatedFat: 0.03 }, defaultServing: 60, tags: ["quick", "lunch", "vegetarian", "savoury", "no_cook"] }),
  referenceFood({ id: "cucumber", name: "Cucumber", aliases: ["cucumbers"], category: "vegetable", referenceSourceId: "13-523", nutrition: { calories: 14, protein: 1, carbs: 1.2, fat: 0.6, fibre: 0.7, sugar: 1.2 }, defaultServing: 80, tags: ["quick", "lunch", "snack", "vegetarian", "savoury", "no_cook"], compatibleMeals: ["lunch", "snack"] }),
  referenceFood({ id: "peas", name: "Garden Peas, Cooked", aliases: ["peas", "green peas", "frozen peas"], category: "vegetable", referenceSourceId: "13-536", nutrition: { calories: 70, protein: 5.5, carbs: 11.2, fat: 0.7, fibre: 5.5, sugar: 5.9, saturatedFat: 0.14 }, defaultServing: 80, tags: ["high_fibre", "quick", "lunch", "vegetarian", "freezer", "savoury", "hob", "microwave"] }),
  referenceFood({ id: "sweetcorn", name: "Sweetcorn, Canned", aliases: ["sweet corn", "corn", "canned sweetcorn", "tinned sweetcorn"], category: "vegetable", referenceSourceId: "13-529", nutrition: { calories: 78, protein: 2.6, carbs: 13.9, fat: 1.7, fibre: 3.1, sugar: 7.5, saturatedFat: 0.27 }, defaultServing: 80, tags: ["quick", "lunch", "vegetarian", "savoury", "no_cook"] }),
  referenceFood({ id: "green-beans", name: "Green Beans, Cooked", aliases: ["green beans", "fine beans", "string beans"], category: "vegetable", referenceSourceId: "13-515", nutrition: { calories: 26, protein: 2.1, carbs: 4, fat: 0.3, fibre: 4.1, sugar: 3, saturatedFat: 0.06 }, defaultServing: 100, tags: ["high_fibre", "lunch", "vegetarian", "savoury", "hob", "microwave"] }),
  referenceFood({ id: "asparagus", name: "Asparagus, Steamed", aliases: ["asparagus"], category: "vegetable", referenceSourceId: "13-638", nutrition: { calories: 21, protein: 2.9, carbs: 1.6, fat: 0.4, fibre: 1.3, sugar: 1.6, saturatedFat: 0.05 }, defaultServing: 100 }),
  referenceFood({ id: "celery", name: "Celery", aliases: ["celery sticks"], category: "vegetable", referenceSourceId: "13-636", nutrition: { calories: 9, protein: 0.5, carbs: 1.4, fat: 0.1, fibre: 1.5, sugar: 1.4, saturatedFat: 0 }, defaultServing: 80, tags: ["quick", "lunch", "snack", "vegetarian", "savoury", "no_cook"], compatibleMeals: ["lunch", "snack"] }),
  referenceFood({ id: "beetroot", name: "Beetroot, Cooked", aliases: ["beetroot", "beets", "cooked beetroot"], category: "vegetable", referenceSourceId: "13-633", nutrition: { calories: 53, protein: 1.6, carbs: 11.6, fat: 0.3, fibre: 2.6, sugar: 10.9, saturatedFat: 0.05 }, defaultServing: 80 }),
  referenceFood({ id: "leek", name: "Leek", aliases: ["leeks"], category: "vegetable", referenceSourceId: "13-624", nutrition: { calories: 23, protein: 1.5, carbs: 4.1, fat: 0.2, fibre: 2.8, sugar: 3.8, saturatedFat: 0.04 }, defaultServing: 100 }),

  // Fruit (12)
  referenceFood({ id: "banana", name: "Banana", aliases: ["bananas"], category: "fruit", referenceSourceId: "14-318", nutrition: { calories: 81, protein: 1.2, carbs: 20.3, fat: 0.1, fibre: 1.4, sugar: 18.1, saturatedFat: 0.04 }, defaultServing: 100 }),
  referenceFood({ id: "apple", name: "Apple", aliases: ["apples", "eating apple"], category: "fruit", referenceSourceId: "14-319", nutrition: { calories: 51, protein: 0.6, carbs: 11.6, fat: 0.5, fibre: 1.2, sugar: 11.6, saturatedFat: 0.12 }, defaultServing: 100 }),
  referenceFood({ id: "blueberries", name: "Blueberries", aliases: ["blueberry"], category: "fruit", referenceSourceId: "14-325", nutrition: { calories: 40, protein: 0.9, carbs: 9.1, fat: 0.2, fibre: 1.5, sugar: 9.1, saturatedFat: 0.02 }, defaultServing: 80 }),
  referenceFood({ id: "orange", name: "Orange", aliases: ["oranges"], category: "fruit", referenceSourceId: "14-327", nutrition: { calories: 36, protein: 0.8, carbs: 8.2, fat: 0.2, fibre: 1.2, sugar: 8.2, saturatedFat: 0.05 }, defaultServing: 100 }),
  referenceFood({ id: "grapes", name: "Grapes", aliases: ["grape", "seedless grapes"], category: "fruit", referenceSourceId: "14-350", nutrition: { calories: 65, protein: 0.7, carbs: 16.1, fat: 0.2, fibre: 1.3, sugar: 16.1, saturatedFat: 0.06 }, defaultServing: 80 }),
  referenceFood({ id: "strawberries", name: "Strawberries", aliases: ["strawberry"], category: "fruit", referenceSourceId: "14-324", nutrition: { calories: 30, protein: 0.6, carbs: 6.1, fat: 0.5, fibre: 3.8, sugar: 6.1, saturatedFat: 0.04 }, defaultServing: 80 }),
  referenceFood({ id: "raspberries", name: "Raspberries", aliases: ["raspberry"], category: "fruit", referenceSourceId: "14-375", nutrition: { calories: 25, protein: 0.8, carbs: 5.1, fat: 0.3, fibre: 3.7, sugar: 5.1, saturatedFat: 0.1 }, defaultServing: 80 }),
  referenceFood({ id: "pear", name: "Pear", aliases: ["pears"], category: "fruit", referenceSourceId: "14-321", nutrition: { calories: 43, protein: 0.3, carbs: 10.9, fat: 0.1, fibre: 2.7, sugar: 10.9, saturatedFat: 0.01 }, defaultServing: 100 }),
  referenceFood({ id: "kiwi", name: "Kiwi Fruit", aliases: ["kiwi", "kiwifruit"], category: "fruit", referenceSourceId: "14-371", nutrition: { calories: 44, protein: 0.8, carbs: 8.6, fat: 0.9, fibre: 2.7, sugar: 8.3, saturatedFat: 0.07 }, defaultServing: 80 }),
  referenceFood({ id: "pineapple", name: "Pineapple", aliases: ["fresh pineapple"], category: "fruit", referenceSourceId: "14-376", nutrition: { calories: 45, protein: 0.5, carbs: 11.4, fat: 0.1, fibre: 1.2, sugar: 11.4, saturatedFat: 0 }, defaultServing: 100 }),
  referenceFood({ id: "mango", name: "Mango", aliases: ["mangoes", "ripe mango"], category: "fruit", referenceSourceId: "14-378", nutrition: { calories: 48, protein: 0.7, carbs: 10.7, fat: 0.6, fibre: 1.1, sugar: 10.4, saturatedFat: 0.15 }, defaultServing: 100 }),
  referenceFood({ id: "peach", name: "Peach", aliases: ["peaches"], category: "fruit", referenceSourceId: "14-299", nutrition: { calories: 33, protein: 1, carbs: 7.6, fat: 0.1, sugar: 7.6, saturatedFat: 0 }, defaultServing: 100 }),

  // Fats and sauces (11)
  referenceFood({ id: "olive-oil", name: "Olive Oil", aliases: ["extra virgin olive oil", "evoo"], category: "fat_sauce", referenceSourceId: "17-038", nutrition: { calories: 899, protein: 0, carbs: 0, fat: 99.9, fibre: 0, sugar: 0, saturatedFat: 14.3 }, defaultServing: 10 }),
  referenceFood({ id: "rapeseed-oil", name: "Rapeseed Oil", aliases: ["canola oil", "vegetable oil"], category: "fat_sauce", referenceSourceId: "17-041", nutrition: { calories: 899, protein: 0, carbs: 0, fat: 99.9, fibre: 0, sugar: 0, saturatedFat: 6.6 }, defaultServing: 10 }),
  referenceFood({ id: "butter", name: "Salted Butter", aliases: ["butter"], category: "fat_sauce", referenceSourceId: "17-685", nutrition: { calories: 744, protein: 0.6, carbs: 0.6, fat: 82.2, fibre: 0, sugar: 0.6, saturatedFat: 52.09 }, defaultServing: 10 }),
  referenceFood({ id: "peanut-butter", name: "Smooth Peanut Butter", aliases: ["peanut butter"], category: "fat_sauce", referenceSourceId: "14-892", nutrition: { calories: 607, protein: 22.8, carbs: 13.1, fat: 51.8, fibre: 6.6, sugar: 6.7, saturatedFat: 12.78 }, defaultServing: 20, tags: ["high_protein", "quick", "breakfast", "snack", "vegetarian", "sweet", "no_cook"], compatibleMeals: ["breakfast", "snack"] }),
  referenceFood({ id: "mayonnaise", name: "Mayonnaise", aliases: ["mayo", "standard mayonnaise"], category: "fat_sauce", referenceSourceId: "17-654", nutrition: { calories: 686, protein: 1.1, carbs: 2.4, fat: 74.8, fibre: 0, sugar: 2.4, saturatedFat: 5.65 }, defaultServing: 15 }),
  referenceFood({ id: "ketchup", name: "Tomato Ketchup", aliases: ["ketchup", "tomato sauce"], category: "fat_sauce", referenceSourceId: "17-709", nutrition: { calories: 115, protein: 1.6, carbs: 28.6, fat: 0.1, fibre: 0.9, sugar: 27.5, saturatedFat: 0 }, defaultServing: 15 }),
  referenceFood({ id: "houmous", name: "Houmous", aliases: ["hummus", "humous"], category: "fat_sauce", referenceSourceId: "13-556", nutrition: { calories: 307, protein: 6.8, carbs: 10.5, fat: 26.7, fibre: 4.9, sugar: 0.6 }, defaultServing: 50, tags: ["high_fibre", "quick", "lunch", "snack", "vegetarian", "savoury", "no_cook"], compatibleMeals: ["lunch", "snack"] }),
  referenceFood({ id: "soy-sauce", name: "Soy Sauce", aliases: ["soya sauce", "light soy sauce", "dark soy sauce"], category: "fat_sauce", referenceSourceId: "17-721", nutrition: { calories: 79, protein: 3, carbs: 17.9, fat: 0, fibre: 0, sugar: 16.4, saturatedFat: 0 }, defaultServing: 10 }),
  referenceFood({ id: "pesto", name: "Red Pesto", aliases: ["pesto", "pesto sauce", "tomato pesto"], category: "fat_sauce", referenceSourceId: "17-623", nutrition: { calories: 317, protein: 5, carbs: 5.9, fat: 30.6, fibre: 3.3, sugar: 5.2, saturatedFat: 4.68 }, defaultServing: 25 }),
  referenceFood({ id: "tomato-pasta-sauce", name: "Tomato Pasta Sauce", aliases: ["pasta sauce", "tomato sauce", "bolognese sauce"], category: "fat_sauce", referenceSourceId: "17-618", nutrition: { calories: 44, protein: 1.5, carbs: 6.9, fat: 1.3, fibre: 2, sugar: 6.1, saturatedFat: 0.21 }, defaultServing: 125 }),
  referenceFood({ id: "avocado", name: "Hass Avocado", aliases: ["avocado", "avocados"], category: "fat_sauce", referenceSourceId: "14-386", nutrition: { calories: 171, protein: 1.8, carbs: 1.8, fat: 17.4, fibre: 3.1, sugar: 0.4, saturatedFat: 4.15 }, defaultServing: 70, tags: ["high_fibre", "quick", "breakfast", "lunch", "vegetarian", "savoury", "no_cook"], compatibleMeals: ["breakfast", "lunch"] }),

  // Generic composite foods (3)
  referenceFood({ id: "margherita-pizza", name: "Cheese and Tomato Pizza", aliases: ["margherita pizza", "cheese pizza"], category: "composite", referenceSourceId: "11-936", nutrition: { calories: 272, protein: 12.2, carbs: 36.1, fat: 9.8, fibre: 2.9, sugar: 3.9, saturatedFat: 4.12 }, defaultServing: 175, tags: ["quick", "lunch", "vegetarian", "savoury", "oven"] }),
  referenceFood({ id: "beef-lasagne", name: "Beef Lasagne", aliases: ["lasagne", "lasagna", "beef lasagna"], category: "composite", referenceSourceId: "19-523", nutrition: { calories: 143, protein: 7.4, carbs: 15.7, fat: 6.1, fibre: 1.7, sugar: 3, saturatedFat: 2.8 }, defaultServing: 350, tags: ["quick", "lunch", "savoury", "oven", "microwave"] }),
  referenceFood({ id: "vegetable-soup", name: "Vegetable Soup, Canned", aliases: ["vegetable soup", "veg soup", "canned soup", "tinned soup"], category: "composite", referenceSourceId: "17-712", nutrition: { calories: 39, protein: 1.4, carbs: 7.4, fat: 0.6, sugar: 2.6 }, defaultServing: 300, tags: ["quick", "lunch", "vegetarian", "savoury", "hob", "microwave"] }),
];

export const commonReferenceFoods = referenceFoods;
