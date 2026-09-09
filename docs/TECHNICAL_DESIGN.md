# Personal Meal Planner V1

## Technical Design & Build Plan

---

# 1. 整体技术架构

V1保持非常轻：

```text
React
  ↓
TypeScript
  ↓
Zustand
  ↓
localStorage

Food Database
  ↓
Meal Generator
  ↓
Recipe Engine
  ↓
Daily Nutrition Calculator
  ↓
Today UI

Food Database
  ↓
Inventory
  ↓
Shopping Recommendation
```

暂时没有：

* 后端
* 用户系统
* 云数据库
* AI API
* 登录
* 网络依赖

这样即使断网也可以使用。

---

# 2. V1最重要的数据关系

不要把“菜”“食物”“营养素”混成一个对象。

系统至少需要五种核心对象：

```text
UserProfile
Food
RecipeTemplate
MealPlan
DailyPlan
```

另外：

```text
Inventory
ShoppingSuggestion
GeneratorConstraints
```

---

# 3. UserProfile

```ts
interface UserProfile {
  id: string;

  heightCm: number;
  weightKg: number;
  goalWeightKg: number;

  goal:
    | "fat_loss"
    | "maintenance"
    | "muscle_gain";

  calorieTarget: {
    min: number;
    max: number;
  };

  proteinTarget: {
    min: number;
    max: number;
  };

  fibreTarget: number;

  fruitVegTargetPortions: number;

  equipment: Equipment[];

  defaultMaxCookingTime: number;
}
```

当前默认：

```ts
{
  heightCm: 171,
  weightKg: 60,
  goalWeightKg: 55,

  goal: "fat_loss",

  calorieTarget: {
    min: 1600,
    max: 1750
  },

  proteinTarget: {
    min: 80,
    max: 100
  },

  fibreTarget: 30,

  fruitVegTargetPortions: 5,

  equipment: [
    "hob",
    "oven",
    "microwave"
  ],

  defaultMaxCookingTime: 30
}
```

以后可以修改，但不能写死进算法。

---

# 4. Food 数据模型

这是整个产品最核心的数据结构。

```ts
type FoodCategory =
  | "protein"
  | "carb"
  | "vegetable"
  | "fruit"
  | "fat_sauce"
  | "composite";

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;

  sugar?: number;
  saturatedFat?: number;
  salt?: number;
}

interface Food {
  id: string;

  name: string;

  category: FoodCategory;

  brand?: string;
  store?: string;

  nutritionBasis:
    | "per_100g"
    | "per_100ml"
    | "per_unit";

  nutrition: Nutrition;

  defaultServing: number;

  servingUnit:
    | "g"
    | "ml"
    | "piece";

  gramsPerUnit?: number;

  inStock: boolean;
  regularBuy: boolean;
  favourite: boolean;

  estimatedNutrition: boolean;

  tags: FoodTag[];

  compatibleMeals: MealType[];
}
```

---

# 5. Food Tags

Tags不是食品分类，而是帮助筛选和生成。

例如：

```ts
type FoodTag =
  | "high_protein"
  | "high_fibre"
  | "quick"
  | "breakfast"
  | "lunch"
  | "snack"
  | "vegetarian"
  | "freezer"
  | "sweet"
  | "savoury"
  | "no_cook"
  | "oven"
  | "hob"
  | "microwave";
```

例如：

## Greek Yogurt

```text
Category:
protein

Tags:
high_protein
breakfast
snack
sweet
no_cook
```

## Chicken Breast

```text
Category:
protein

Tags:
high_protein
lunch
hob
oven
```

---

# 6. 为什么一定要有 compatibleMeals

否则随机算法会出现：

> 中午：Greek Yogurt + Rice + Broccoli

营养数字可能没问题，但根本不像正常的一餐。

因此每个食品都有：

```ts
compatibleMeals: [
  "breakfast",
  "lunch",
  "snack"
]
```

例如：

```text
Egg:
Breakfast
Lunch
Snack

Pasta:
Lunch

Blueberries:
Breakfast
Snack

Chicken Breast:
Lunch

Greek Yogurt:
Breakfast
Snack
```

---

# 7. Serving模型

系统里的营养计算全部基于实际份量。

例如：

Chicken Breast：

```text
Nutrition basis:
100g

Calories:
165

Protein:
31

User portion:
140g
```

计算：

```ts
multiplier = 140 / 100;
```

得到：

```text
Calories = 231
Protein = 43.4g
```

---

# 8. MealItem

Meal不是直接保存Food。

需要保存：

```ts
interface MealItem {
  foodId: string;

  amount: number;

  unit: "g" | "ml" | "piece";

  locked: boolean;
}
```

例如：

```text
Chicken
140g
locked = true

Pasta
75g
locked = false

Mushroom
100g
locked = false
```

---

# 9. MealPlan

```ts
interface MealPlan {
  id: string;

  type:
    | "breakfast"
    | "lunch"
    | "snack";

  name: string;

  items: MealItem[];

  recipeTemplateId?: string;

  nutrition: Nutrition;

  cookingTime?: number;

  equipment: Equipment[];
}
```

---

# 10. DailyPlan

```ts
interface DailyPlan {
  date: string;

  breakfast: MealPlan | null;

  lunch: MealPlan | null;

  snack: MealPlan | null;

  totalNutrition: Nutrition;

  fruitVegPortions: number;

  status: {
    calories: TargetStatus;
    protein: TargetStatus;
    fibre: TargetStatus;
    fruitVeg: TargetStatus;
  };
}
```

---

# 11. 目标状态

不要只有：

```text
pass / fail
```

设计为：

```ts
type TargetStatus =
  | "good"
  | "close"
  | "low"
  | "high";
```

UI：

```text
Protein
91g
✓ Within target
```

或者：

```text
Fibre
24g
Close to target
```

---

# 12. Recipe系统不要保存大量固定菜谱

我们采用：

# Recipe Template

而不是：

# Fixed Recipe

例如：

```text
Creamy Pasta
```

不是固定：

Chicken + Mushroom。

而是：

```text
Protein Slot

+

Pasta Slot

+

Vegetable Slot

+

Cream Sauce Slot
```

---

# 13. RecipeTemplate 数据结构

```ts
interface RecipeTemplate {
  id: string;

  name: string;

  mealTypes: MealType[];

  cookingTime: number;

  equipment: Equipment[];

  slots: RecipeSlot[];

  instructions: RecipeInstruction[];

  tags: string[];
}
```

---

# 14. RecipeSlot

```ts
interface RecipeSlot {
  id: string;

  type:
    | FoodCategory
    | "specific";

  allowedFoodIds?: string[];

  allowedTags?: string[];

  minItems: number;
  maxItems: number;

  optional: boolean;
}
```

例如 Creamy Pasta：

```text
Slot 1
Protein
1 item

Slot 2
Carb
Allowed: pasta

Slot 3
Vegetable
1–2 items

Slot 4
Fat/Sauce
Allowed: cream-based sauces
```

---

# 15. 第一批Recipe Templates

V1暂时不用很多。

建议先做大约 **12种模板**。

### Breakfast

1. Eggs + Toast Plate
2. Yogurt Bowl
3. Oat Bowl
4. Savoury Toast
5. Quick Breakfast Plate

### Lunch

6. Pasta
7. Rice Bowl
8. Stir Fry
9. Oven Tray Meal
10. Wrap
11. Potato Plate

### Snack

12. Yogurt Snack
13. Egg Snack
14. Fruit + Protein Snack

实际先做12–14个已经足够随机出很多组合。

---

# 16. 为什么Template比AI Recipe重要

假设我们有：

Protein：

```text
Chicken
Shrimp
Salmon
```

Vegetable：

```text
Spinach
Mushroom
Broccoli
```

一个Pasta模板已经可以生成至少：

```text
Chicken Mushroom Pasta

Chicken Spinach Pasta

Chicken Broccoli Pasta

Shrimp Mushroom Pasta

Shrimp Spinach Pasta

Shrimp Broccoli Pasta

Salmon Mushroom Pasta
...
```

不需要提前写几十个菜谱。

---

# 17. Meal Generator

Generator应该是整个项目里最重要的纯函数模块。

不要把随机逻辑直接写在React组件里面。

建议：

```text
src/
  engine/
    mealGenerator.ts
```

---

# 18. Generator输入

```ts
interface GeneratorConstraints {
  mealType: MealType;

  lockedFoodIds: string[];

  includedFoodIds: string[];

  excludedFoodIds: string[];

  inventoryOnly: boolean;

  maxCookingTime?: number;

  allowedEquipment: Equipment[];

  preferences?: {
    highProtein?: boolean;
    lighterMeal?: boolean;
    sweet?: boolean;
    savoury?: boolean;
  };
}
```

---

# 19. Generator第一步：过滤模板

比如Lunch。

过滤掉：

```text
Breakfast templates
Snack templates
```

再根据：

```text
max cooking time
equipment
```

过滤。

例如：

用户说：

> 不想开烤箱

则：

```text
Oven Tray Meal
```

直接排除。

---

# 20. 第二步：食品候选池

根据每一个slot：

寻找符合条件的Food。

例如：

```text
Protein Slot
```

候选：

```text
Chicken
Shrimp
Beef
Salmon
Tofu
```

如果：

```text
inventoryOnly = true
```

则只保留：

```text
inStock = true
```

---

# 21. 第三步：处理Locked Food

例如用户锁定：

```text
Chicken
```

系统先寻找：

> 哪些Recipe Template能够容纳Chicken？

例如：

```text
Pasta ✓
Rice Bowl ✓
Stir Fry ✓
Wrap ✓
Oven Tray ✓
```

然后再从这些Template里继续选择。

Locked Food是Hard Constraint。

---

# 22. 第四步：生成Candidate Meals

例如生成：

```text
Candidate 1

Chicken
Pasta
Mushroom
Cream Sauce
```

```text
Candidate 2

Chicken
Pasta
Spinach
Tomato Sauce
```

```text
Candidate 3

Chicken
Potato
Broccoli
Olive Oil
```

一次内部生成：

**20–50个候选**

已经足够V1使用。

---

# 23. 初始Portion设置

每个Food设置：

```text
defaultServing
```

例如：

```text
Chicken = 140g
Pasta = 75g
Rice = 150g cooked
Broccoli = 100g
Sauce = 50g
```

Candidate先使用默认portion。

---

# 24. Nutrition Calculator

单独模块：

```text
src/
  engine/
    nutritionCalculator.ts
```

函数：

```ts
calculateFoodNutrition()

calculateMealNutrition()

calculateDailyNutrition()
```

所有页面都调用它。

绝对不要：

Food Library自己算一套
Meal Generator自己算一套
Today页面自己再算一套。

---

# 25. Daily Generator比Meal Generator多一层

用户点击：

# Generate My Day

流程：

```text
Generate Breakfast

↓

Generate Lunch

↓

Calculate current day nutrition

↓

Generate Snack specifically to fill gaps
```

Snack不是完全随机。

例如Breakfast + Lunch已经：

```text
Protein 75g
Calories 1350
```

那么Snack应该倾向：

```text
150–300 kcal
10–20g protein
```

而不是又生成：

```text
Peanut Butter + Nuts + Granola
```

---

# 26. Candidate Scoring

每个Meal Candidate计算Score。

建议V1：

```text
Nutrition Fit
40%

Recipe Compatibility
25%

Inventory Usage
15%

Preference Match
10%

Variety
5%

Convenience
5%
```

---

# 27. Nutrition Fit

例如Lunch希望：

```text
约500–700 kcal

Protein:
约30–45g
```

注意：

这是Generator内部参考区间。

不是告诉用户：

> “午餐必须600 kcal。”

---

# 28. 不应该完全选最高分

否则：

用户连续点：

Randomise

可能一直得到：

Chicken Pasta。

正确逻辑：

```text
所有Candidate评分

↓

取Top 20%

↓

Weighted Random
```

高分更容易出现，但不会永远同一个。

---

# 29. Variety机制

保存最近使用：

```text
recentFoodIds
recentRecipeTemplateIds
```

如果：

昨天Lunch已经Chicken Pasta，

今天同样组合：

减一点Score。

这样才能真的有随机搭配价值。

---

# 30. Lock & Regenerate流程

当前：

```text
Chicken 🔒

Pasta

Mushroom

Cream Sauce
```

点击：

**Regenerate**

Generator接收到：

```ts
lockedFoodIds = ["chicken"];
```

新的结果：

```text
Chicken 🔒
Rice
Broccoli
Teriyaki Sauce
```

---

# 31. 单个Ingredient替换

以后还可以有：

点击：

```text
Mushroom
```

出现：

**Swap**

系统只在同类兼容Food里选择：

```text
Spinach
Broccoli
Pepper
Courgette
```

而不用重新生成整个Meal。

这可以先留接口，V1后半段再做。

---

# 32. 自然语言解析架构

第一版：

```text
Input
↓
Rule Parser
↓
Constraints
↓
Chips
↓
Generator
```

例如：

> 中午想吃鸡肉，20分钟以内，不要米饭，只用家里的。

解析：

```ts
{
  mealType: "lunch",

  includedFoodIds: [
    "chicken"
  ],

  excludedFoodIds: [
    "rice"
  ],

  maxCookingTime: 20,

  inventoryOnly: true
}
```

---

# 33. Chips UI

输入以后立即显示：

```text
[Chicken ×]

[≤20 min ×]

[No rice ×]

[In stock only ×]
```

用户可以删除错误解析。

然后：

**Generate**

---

# 34. Natural Language第一版支持范围

只支持：

## Include

```text
想吃鸡肉
想吃意面
想吃三文鱼
```

## Exclude

```text
不要米饭
不想吃鸡蛋
```

## Time

```text
10分钟
20分钟
快速
```

## Equipment

```text
不要烤箱
只用微波炉
```

## Inventory

```text
只用家里的
```

## Style

```text
想吃咸的
想吃甜的
清淡一点
高蛋白一点
```

不要第一版试图理解所有自然语言。

---

# 35. Shopping Recommendation算法

需要区分：

## Recipe Shopping

和：

## Smart Shopping

---

# 36. Recipe Shopping

最简单。

Recipe需要：

```text
Chicken
Pasta
Spinach
Cream Sauce
```

库存：

```text
Chicken ✓
Pasta ✓

Spinach ✗
Cream Sauce ✗
```

输出：

```text
To Buy

□ Spinach
□ Cream Sauce
```

---

# 37. Smart Shopping

这个功能更有产品价值。

核心问题：

> 买了这个东西以后，我能多做多少种Meal？

计算：

```text
Recipe Coverage
```

例如：

Chicken加入库存后：

可以解锁：

```text
8种recipe combinations
```

Spinach：

```text
7种
```

某个特别小众的Sauce：

```text
2种
```

于是Chicken和Spinach优先。

---

# 38. Shopping Score

第一版可以：

```text
Shopping Score =

Recipe Coverage × 0.4

+

Meal Versatility × 0.25

+

Nutrition Utility × 0.2

+

Regular Buy × 0.1

+

Favourite × 0.05
```

---

# 39. 页面导航

手机端Bottom Navigation：

```text
Today

Foods

Recipes

Shop
```

右上角：

```text
Settings
```

---

# 40. Today页面Wireframe

```text
┌─────────────────────────┐
│ Today            ⚙      │
│ Wednesday · 9 Sep       │
│                         │
│ 1645 kcal               │
│ Within target ✓         │
│                         │
│ Protein       91g ✓     │
│ Fibre         28g       │
│ Fruit & Veg   5 ✓       │
│                         │
├─────────────────────────┤
│ BREAKFAST               │
│                         │
│ Eggs & Yogurt Toast     │
│ 430 kcal · P 29g        │
│                         │
│ Eggs       2        🔒  │
│ Toast      2 slices     │
│ Yogurt     150g         │
│ Blueberry  80g          │
│                         │
│ Recipe  Edit  ↻         │
├─────────────────────────┤
│ LUNCH                   │
│                         │
│ Creamy Chicken Pasta    │
│ 610 kcal · P 41g        │
│                         │
│ Recipe  Edit  ↻         │
├─────────────────────────┤
│ EVENING SNACK           │
│                         │
│ Skyr + Banana           │
│ 220 kcal · P 18g        │
│                         │
│ Recipe  Edit  ↻         │
├─────────────────────────┤
│                         │
│     🎲 Generate My Day  │
│                         │
└─────────────────────────┘
```

---

# 41. Meal Regeneration弹窗

```text
What do you feel like?

┌────────────────────────┐
│ chicken, no rice,      │
│ under 20 minutes       │
└────────────────────────┘

[Chicken ×]
[No Rice ×]
[≤20 min ×]

☑ Use ingredients I have

        Generate
```

---

# 42. Foods页面

```text
Foods

[ Search foods... ]

All
Protein
Carbs
Vegetables
Fruit
Sauces
Composite

[In Stock]
[Regular Buy]
[Favourites]

------------------

Chicken Breast
Protein

165 kcal / 100g
31g protein

✓ In stock

------------------

Greek Yogurt
Protein

...

             + Add Food
```

---

# 43. Add Food页面

```text
Add Food

Name
[                    ]

Category
[ Protein ▼ ]

Brand
[                    ]

Store
[ Lidl ▼ ]

Nutrition based on
[ per 100g ▼ ]

Calories
Protein
Carbs
Fat
Fibre

Default serving
[ 200 ] g

☑ In stock
☐ Regular buy
☐ Favourite

Save
```

---

# 44. Recipes页面

```text
Recipes

Suggested for you

[ Creamy Chicken Pasta ]
18 min · Hob
You have all ingredients ✓

[ Salmon Potato Tray ]
28 min · Oven
Missing 1 ingredient

----------------

Quick
High Protein
Pasta
Rice
Oven
Breakfast
```

---

# 45. Shop页面

```text
Shop

Recommended to Buy

Chicken Breast
Used across 12 meal combinations

Spinach
Used across 9 meal combinations

Eggs
Breakfast · Lunch · Snack

----------------

Needed for Saved Recipes

□ Mushroom
□ Greek Yogurt
□ Pasta Sauce
```

---

# 46. Zustand结构

不要把所有东西塞一个巨大Store。

建议：

```text
stores/

profileStore.ts

foodStore.ts

dailyPlanStore.ts

recipeStore.ts
```

如果V1想简单，也可以先：

```text
useAppStore.ts
```

但内部保持清晰slice：

```text
profile
foods
recipes
dailyPlan
```

---

# 47. 推荐目录

```text
src/

components/
  MealCard.tsx
  NutritionSummary.tsx
  FoodCard.tsx
  FoodSelector.tsx
  ConstraintChip.tsx

pages/
  TodayPage.tsx
  FoodsPage.tsx
  AddFoodPage.tsx
  RecipesPage.tsx
  ShopPage.tsx
  SettingsPage.tsx

data/
  seedFoods.ts
  recipeTemplates.ts

types/
  food.ts
  meal.ts
  recipe.ts
  profile.ts

engine/
  nutritionCalculator.ts
  mealGenerator.ts
  dailyGenerator.ts
  shoppingEngine.ts
  constraintParser.ts

stores/
  useAppStore.ts

utils/
  storage.ts
```

---

# 48. 开发顺序

不要先做随机算法。

## Phase 1 — Data Foundation

目标：

> 产品能可靠地保存、展示、修改Food数据，并正确计算营养。

完成：

* React/Vite/TS项目
* Navigation
* Type definitions
* Zustand
* localStorage
* User Profile
* Seed Foods
* Foods页面
* Add/Edit Food
* Portion calculator
* Nutrition calculator

---

## Phase 2 — Meal Planning

完成：

* Today页面
* MealCard
* Recipe Templates
* Meal Generator
* Generate Breakfast
* Generate Lunch
* Generate Snack
* Generate My Day
* Daily Nutrition Summary
* Lock & Regenerate
* Portion editing

---

## Phase 3 — Recipe + Shopping

完成：

* Recipe详情
* 动态Ingredient substitution
* Equipment filtering
* Cooking time
* Inventory
* Missing ingredients
* Smart Shopping

---

## Phase 4 — Natural Language

完成：

* Text input
* Rule parser
* Constraint Chips
* Conditional generation

之后再决定是否：

接LLM API。

---

# 49. Phase 1不要做的事情

Codex如果自行开始做这些，要阻止：

* AI
* API
* Backend
* Login
* Database
* Barcode scanning
* Food photo recognition
* Fancy animations
* Dark mode
* Weight tracking
* Exercise tracking

第一阶段的目标只有：

# 把数据底座做对。

---

# 50. 第一个Codex Prompt

直接复制以下内容作为第一次开发任务：

```text
You are helping me build a mobile-first personal meal planning web app.

Please implement ONLY Phase 1 of the project. Do not build the meal-generation algorithm, AI features, backend, authentication, shopping recommendations, or advanced recipe functionality yet.

TECH STACK
- React
- TypeScript
- Vite
- Zustand
- localStorage
- Mobile-first responsive UI

PRODUCT CONTEXT

This is a nutrition-aware personal meal planner.

The future product will plan three daily eating occasions:
1. Breakfast
2. Lunch
3. Evening Snack

The app is currently for one user, but profile and nutrition targets must remain configurable rather than hard-coded into business logic.

DEFAULT PROFILE
- Height: 171 cm
- Weight: 60 kg
- Goal weight: 55 kg
- Goal: fat loss
- Calorie target: 1600–1750 kcal/day
- Protein target: 80–100 g/day
- Fibre target: 30 g/day
- Fruit & vegetable target: 5 portions/day
- Equipment: hob, oven, microwave

FOOD CATEGORIES
Use exactly these six categories:
- protein
- carb
- vegetable
- fruit
- fat_sauce
- composite

CORE FOOD DATA MODEL

Each Food should support:
- id
- name
- category
- optional brand
- optional store
- nutrition basis: per_100g, per_100ml, or per_unit
- calories
- protein
- carbs
- fat
- fibre
- optional sugar
- optional saturated fat
- optional salt
- default serving amount
- serving unit: g, ml, or piece
- optional grams per unit
- inStock
- regularBuy
- favourite
- estimatedNutrition
- tags
- compatibleMeals

Compatible meals:
- breakfast
- lunch
- snack

IMPORTANT NUTRITION RULE

Nutrition values must be calculated deterministically from the structured food data and selected portion.

Do not let UI components independently calculate nutrition.

Create reusable pure functions:
- calculateFoodNutrition
- calculateMealNutrition
- calculateDailyNutrition

Keep these inside an engine layer.

PHASE 1 FEATURES

1. Create TypeScript interfaces/types for:
- UserProfile
- Nutrition
- Food
- FoodCategory
- FoodTag
- MealType

2. Create a Zustand store persisted to localStorage.

The store should contain:
- profile
- foods

Support:
- addFood
- editFood
- deleteFood
- toggleInStock
- toggleFavourite
- toggleRegularBuy
- updateProfile

3. Seed the app with approximately 25 realistic starter foods across all six categories.

Examples:
Protein:
- eggs
- Greek yogurt
- Skyr
- chicken breast
- chicken thigh
- lean beef
- salmon
- tuna
- shrimp
- tofu

Carbs:
- rice
- pasta
- wholemeal toast
- oats
- potato
- wrap

Vegetables:
- broccoli
- spinach
- mushroom
- tomato
- mixed peppers

Fruit:
- banana
- apple
- blueberries

Fat/Sauce:
- olive oil
- pesto
- cream pasta sauce

Composite:
- supermarket pizza

Nutrition values can initially be marked as estimated unless intended as example package-label data.

4. Build bottom navigation placeholders for:
- Today
- Foods
- Recipes
- Shop

Settings should be accessible from a top-right settings button.

Only Foods and Settings need to be substantially functional in this phase.

5. Build the Foods page.

Features:
- Search
- Category filters
- In Stock filter
- Favourite filter
- Regular Buy filter

Each food card should show:
- Name
- Category
- Calories using its nutrition basis
- Protein
- Stock status

6. Build Add Food and Edit Food forms.

Fields:
- name
- category
- brand
- store
- nutrition basis
- calories
- protein
- carbs
- fat
- fibre
- sugar optional
- saturated fat optional
- salt optional
- default serving
- serving unit
- grams per unit when relevant
- inStock
- regularBuy
- favourite

Validate obvious invalid inputs.

7. Build Settings/Profile page.

Allow editing:
- height
- weight
- goal weight
- calorie target min/max
- protein target min/max
- fibre target
- fruit & veg target
- equipment
- default max cooking time

8. Create a simple reusable PortionNutritionPreview component.

Example:

Greek Yogurt
Nutrition basis: per 100g
Selected serving: 200g

The preview should correctly show the calculated nutrition for 200g.

9. Create clean mobile-first styling.

DESIGN DIRECTION

The app should feel:
- light
- calm
- practical
- modern
- food-oriented
- not like a hardcore calorie tracker

Avoid:
- aggressive red warnings
- fitness-bro styling
- excessive gradients
- complex dashboards

Use generous spacing, rounded cards, simple typography and restrained visual hierarchy.

ARCHITECTURE

Use approximately:

src/
  components/
  pages/
  data/
  types/
  engine/
  stores/
  utils/

Do not put business logic directly inside page components.

IMPORTANT

Before coding:
1. Briefly inspect the existing repository.
2. Explain the files you intend to create or change.
3. Then implement Phase 1.
4. Run the available typecheck/build checks.
5. Fix errors you encounter.
6. At the end, summarize what was implemented and identify anything intentionally deferred to Phase 2.

Do not start Phase 2.
```

---

# 51. Phase 1完成后的验收清单

你自己打开网站时必须能做到：

```text
□ 能看到Foods页面

□ 默认已经有一批食品

□ 可以按Protein / Carb等分类筛选

□ 可以搜索Chicken

□ 可以把Chicken标记为In Stock

□ 刷新网页以后状态还在

□ 可以新增Lidl买来的食品

□ 可以输入包装上的营养表

□ 可以修改食品

□ 可以删除食品

□ 可以修改自己的身高体重和目标

□ 200g酸奶能正确按100g营养值×2

□ 50g食品能正确×0.5

□ 所有计算逻辑不依赖UI组件
```

如果这些全部通过，再进入Phase 2。

---

# 52. 开发时最需要防止的一个问题

不要因为是Vibe Coding就让项目迅速长成：

```text
AI Diet Coach
+
Recipe App
+
Calorie Tracker
+
Shopping App
+
Fitness App
```

你的V1核心始终只有：

> **我家有什么 → 我今天想吃什么 → 系统帮我科学搭配 → 告诉我怎么做 → 告诉我下次值得买什么。**

其他东西都暂时不重要。
