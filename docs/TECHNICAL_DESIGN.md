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
  fibre?: number;

  sugar?: number;
  saturatedFat?: number;
  salt?: number;
}

interface Food {
  id: string;

  referenceFoodId?: string;

  aliases?: string[];
  referenceSourceName?: string;
  referenceSourceId?: string;
  referenceSourceUrl?: string;

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

  nutritionSource:
    | "reference"
    | "package_label"
    | "manual_estimate";

  fibreSourceMethod?: "AOAC" | "NSP";

  // Phase 1兼容字段；新逻辑以nutritionSource为准
  estimatedNutrition: boolean;

  tags: FoodTag[];

  compatibleMeals: MealType[];
}

type ReferenceFood = Food & {
  aliases: string[];
  referenceSourceName: string;
  referenceSourceId: string;
  referenceSourceUrl: string;
  nutritionSource: "reference";
};
```

`referenceFoodId`用于记录User Food来自哪个Reference Food。它不替代User Food自己的`id`。

## 4.1 Reference Food与User Food

### Reference Food

Reference Food是系统内置、只读的基础食品参考数据：

```text
referenceFoods
```

它作为Common Food搜索源，包含结构化营养、默认份量、aliases、来源元数据、tags和compatibleMeals，但不直接作为用户库存中的可编辑对象。当前包含161条Reference Foods，分类数量为41 / 29 / 41 / 22 / 22 / 6（protein / carb / vegetable / fruit / fat_sauce / composite）。

160条营养数据来自UK CoFID 2021；Plain Skyr使用USDA FoodData Central记录以保持已有`skyr` reference ID有效。`referenceSourceId`保存CoFID Food Code或FDC ID，`referenceSourceUrl`指向对应官方页面。所有数据在构建时静态打包；应用运行时不访问营养数据库或API。

Reference fibre规则：

* 统一`nutrition.fibre`只保存明确的AOAC值
* 不把NSP值映射或换算到`nutrition.fibre`
* 缺少可靠AOAC值时保留`nutrition.fibre = undefined`
* 当前161项中134项有AOAC fibre，27项暂缺，没有任何Reference Food把NSP写入统一字段
* `fibreSourceMethod = "NSP"`只表示不可与30g/day目标直接比较的数据；当前静态Reference Foods不保存这类值

### User Food

User Food保存在Zustand store和localStorage中。它可以来自：

```text
Reference Food copy
Package label manual entry
Manual estimate entry
```

从Reference Food创建时必须复制：

* nutrition对象
* aliases数组和reference source元数据
* tags数组
* compatibleMeals数组
* default serving和单位信息

创建出的User Food拥有新的`id`并保存原始`referenceFoodId`。两者不能共享可变对象引用，确保编辑User Food不会污染reference data。

Foods页面读取和展示的是Zustand中的My Foods / User Food Library。`inStock`是User Food的布尔状态，不是独立集合，也不创建第三个Food Library。

数据流固定为：

```text
Reference Food Library
→ Quick Add / Multi Add
→ My Foods / User Food Library
→ optional inStock filter
→ Meal Generator
```

Meal Generator的数据边界固定为Zustand中的User Food Library，不允许直接把Reference Food目录当作可生成食材。

## 4.2 Nutrition Source

```ts
type NutritionSource =
  | "reference"
  | "package_label"
  | "manual_estimate";
```

UI对应显示：

```text
reference       → Reference nutrition / Standard estimate
package_label   → Package label
manual_estimate → Manual estimate
```

`estimatedNutrition`暂时保留用于兼容Phase 1数据；新增和迁移后的数据以`nutritionSource`作为来源真值。

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

## Default Serving与Package Size

`defaultServing`是未来生成Meal时通常使用的起始份量，不是商品包装净含量。

Phase 1.1不增加package size字段，也不实现：

* 库存剩余克数
* 库存消耗或自动扣减
* 包装数量追踪

Inventory仍然只通过`inStock: boolean`表达。

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

Phase 2.2在同一天的Today state中保存两个互相独立的DailyPlan slot：

```ts
type PlanningMode = "free" | "inventory";

interface ModeDailyPlans {
  free: DailyPlan | null;
  inventory: DailyPlan | null;
}

interface DailyPlanState {
  dailyPlans: ModeDailyPlans;
  activePlanningMode: PlanningMode;
}
```

当前页面只读取：

```ts
dailyPlans[activePlanningMode]
```

一个slot为`null`不影响另一个slot。UI应显示该mode的empty state，并等待用户主动执行`Generate My Day`。

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

# Meal Blueprint（代码兼容名：RecipeTemplate）

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

# 13. Meal Blueprint / RecipeTemplate 数据结构

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

这14个对象现在作为结构性Meal Blueprints使用。为保持已有`recipeTemplateId`、Saved Recipe和V1数据兼容，代码继续保留`RecipeTemplate` / `recipeTemplates`名称，同时导出`MealBlueprint` / `mealBlueprints`语义别名。

## CookingTechnique层

```ts
interface CookingTechnique {
  id: CookingTechniqueId;
  supportedMealTypes: MealType[];
  compatibleBlueprintIds?: string[];
  requiredEquipment: Equipment[];
  cookingTime: number;
  minIngredients: number;
  maxIngredients: number;
  requiredCategories?: FoodCategory[];
  requiredAnyFoodIds?: string[];
  allowedCategories?: FoodCategory[];
  rule: CookingTechniqueRule;
  tags: string[];
}
```

Technique按scramble、omelette、pan sear、stir fry、boil/assemble、toast topping、cold assemble、oven roast、pasta toss、rice bowl assemble、wrap fill、yogurt bowl和oat bowl定义，不创建food-pair-specific templates。`cookingTechnique.ts`负责纯函数compatibility、默认选择及zh-CN/en确定性name/instruction builder。

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

# 19. Generator第一步：过滤Blueprint并匹配Technique

比如Lunch。

过滤掉：

```text
Breakfast templates
Snack templates
```

结构层先按meal type过滤Blueprint。选出actual ingredients后，再根据Technique的：

```text
max cooking time
equipment
```

过滤。

过滤兼容做法。例如：

用户说：

> 不想开烤箱

则需要oven的`oven_roast`不可用；同一Blueprint若仍有不需要oven的合法technique，可以继续生成。

Generator候选携带`template + technique + items`。设备与时间约束最终作用于selected technique，而不是把Blueprint名称误当作唯一烹饪方式。

## Standard-first与Relaxed Composition

```text
Tier 1: 14个标准Blueprint正常slot matching
→ 有候选：直接评分与选择
→ 0候选：进入Tier 2

Tier 2: Relaxed Composition
→ Breakfast 1–3项
→ Lunch 2–4项
→ Snack 1–2项
→ 仍需通过meaningful CookingTechnique compatibility
```

Relaxed层只消费与当前meal兼容的User Foods，继续应用inventoryOnly、locked/included/excluded foods、equipment和max time。它不直接读取Reference Foods，也不跳过nutrition engine。Nutrition Fit只参与排序，不作为稀疏库存的全候选淘汰条件。

真正无法组成最低结构时返回明确错误：

```text
There aren’t enough suitable in-stock foods for this meal.
Add a few foods or switch to Plan Freely.
```

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

候选池的输入始终是User Foods。Planning Mode只控制是否应用`inStock`过滤：

```text
Plan Freely
inventoryOnly = false
→ all User Foods

Use What I Have
inventoryOnly = true
→ User Foods where inStock = true
```

如果：

```text
inventoryOnly = true
```

则只保留：

```text
inStock = true
```

两种模式都不得直接读取Reference Food Library。`Plan Freely`表示使用全部My Foods，不表示探索系统认识的全部食品。`Explore / Try Something New`留到Shopping / Discovery阶段，不作为Meal Generator模式实现。

Phase 2.2中，`inventoryOnly`仍是Generator constraint，不再是Today当前模式的唯一持久化状态。调用Generator时由active mode确定：

```text
activePlanningMode = "free"      → inventoryOnly = false
activePlanningMode = "inventory" → inventoryOnly = true
```

生成成功后只写入`dailyPlans[activePlanningMode]`，不得修改另一slot。Meal Generator、candidate scoring和recipe templates本身不需要为双slot模型做第二套实现。

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

`calculateFoodNutrition`只在Food具有AOAC可比fibre时返回portion fibre；未知或`fibreSourceMethod = "NSP"`时返回`fibre = undefined`。`calculateMealNutrition`和`calculateDailyNutrition`把缺失/NSP contribution排除，只汇总AOAC值，因此与30g/day target比较的total不会混入口径不同的数据。为兼容V2已有package-label Food，未标记method的包装fibre仍按英国标签AOAC口径处理；`manual_estimate`未明确标记AOAC时不进入fibre total。

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

单餐Regenerate另使用不持久化的短期variant history：

```ts
type MealVariantKey = string; // blueprint/template + technique + sorted ingredient foodIds

recentMealVariantKeys: Record<PlanningMode, Record<MealType, MealVariantKey[]>>;
```

每个mode、每个meal type记录当前轮换周期内已经离开的variant。选择时优先排除该集合，因此最近1–2次展示会自然受到保护，而且在所有当前可用替代项出现前不会提前复用旧variant；替代项耗尽并开始复用时重置下一轮周期。该状态只用于当前会话，不加入localStorage，Persistence继续保持V6。

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

Regenerate仍先执行现有候选生成、hard constraints与scoring，然后按以下顺序选择：

```text
1. 排除与当前variant完全相同的候选
2. 优先保留最近1–2次未展示的替代variant
3. 替代variant耗尽后，允许复用较早variant
4. 若没有任何替代variant，保留当前meal并返回可显示的说明状态
```

初次`Generate My Day`不传入regeneration context，因此原有weighted-random选择保持不变。切换planning mode不会生成或覆盖plan；单餐历史与`dailyPlans.free` / `dailyPlans.inventory`相互隔离。Locked ingredients、inventory filtering、equipment、cooking time与nutrition计算链路均不改变。

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

# 32. 自然语言解析架构（Deferred）

Natural Language Planning不包含在当前V1中。以下架构仅作为未来实现方向保留：

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

# 33. Chips UI（Future）

未来启用Natural Language Planning后，输入可以显示：

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

# 34. Natural Language未来支持范围

未来第一版建议只支持：

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

未来实现也不应试图一次理解所有自然语言。

当前V1不包含Parser、Natural Language输入或Constraint Chips。Meal refinement继续使用现有确定性交互：

```text
Generate My Day
Meal Regenerate
Lock / Unlock
Portion Edit
Ingredient Swap
```

---

# 35. Shopping Recommendation算法

需要区分：

## Recipe Shopping

和：

## Smart Shopping

当前Shop页面由以下能力组成：

* Shopping List
* Missing Ingredients
* Needed for Your Plan
* Stock Up
* Discover New Foods
* Mark as Bought

Shopping List是唯一新增并持久化的Shopping状态。其记录来源支持：

```ts
type ShoppingItemSource =
  | "current_plan"
  | "recipe"
  | "saved_recipe"
  | "manual";

interface ShoppingItem {
  id: string;
  foodId?: string;
  referenceFoodId?: string;
  displayName: string;
  sources: ShoppingItemSource[];
  createdAt: string;
}
```

去重时优先使用`referenceFoodId`，否则使用`foodId`。同一食品可以合并多个source，但只显示一条Shopping Item。Phase 3B不在Shopping Item中引入购买数量或库存数量。

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

Missing Ingredients不单独保存，而是在render / selector阶段根据最新User Food的`inStock`即时派生：

```text
Generated Recipe ingredient
→ 使用foodId匹配User Food

Saved Recipe ingredient snapshot
→ 优先使用foodId匹配User Food
→ 找不到时使用referenceFoodId匹配
→ 仍无法匹配时返回Stock status unavailable
```

这里不允许仅凭名称猜测库存状态。Saved Recipe snapshot可保留可选`referenceFoodId`，用于原User Food被重新创建后的安全匹配。

Current Plan、Generated Recipe和Saved Recipe都可以把明确缺少的ingredient加入Shopping List；用户也可以从My Foods手动添加。

`Mark as Bought`的状态变更规则：

```text
已有关联User Food
→ 更新该User Food的inStock = true
→ 移除对应shopping record

Reference-only item
→ 从Reference Food创建独立User Food copy
→ 保留referenceFoodId
→ 设置inStock = true
→ 移除对应shopping record
```

Reference Food始终只读。单独移除Shopping Item只删除shopping record，不删除User Food。

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

Shopping推荐区拆成三个互不混淆的派生view：

## Plan Needed

输入为当前`dailyPlans[activePlanningMode]`与User Foods。遍历Breakfast、Lunch和Snack的MealItems，只保留可按`foodId`匹配且`inStock = false`的User Food，并按foodId去重、聚合`mealTypes`。它是事实集合，不计算score，也不保存独立missing state。

## Stock Up

候选必须满足：

```text
food ∈ My Foods AND food.inStock = false
```

它只推荐用户已经加入My Foods、当前不在库存中的食品。排序完全独立于DailyPlan，使用recipe coverage、regularBuy、meal versatility与favourite。页面展示前排除同一批Plan Needed food IDs，避免重复。

## Discover New Foods

候选必须满足：

```text
food ∈ Reference Foods AND food ∉ My Foods
```

它只提供发现建议，不直接把Reference Food放入Meal Generator。用户明确选择`Add to My Foods`后才创建独立User Food copy并进入planning pool；默认`inStock = false`。如果用户选择加入并标记已购买，则新copy设置为`inStock = true`。任何操作都不修改Reference Food。

---

# 38. Stock Up Score与推荐批次

第一版可以：

```text
Shopping Score =

Recipe Coverage × 0.40

+

Regular Buy × 0.25

+

Meal Versatility × 0.20

+

Favourite × 0.15
```

Current Plan Need不再进入Stock Up score。`getBuyAgainSuggestions`只接收User Foods与Recipe Templates，保证ranking不依赖当前plan。

Stock Up与Discover New Foods都先得到稳定排序的高分候选池（最多约12项），再由纯函数按每批4项切片。当前batch index只保存在ShopPage本地state；点击换一批进入下一组并在末尾循环，refresh回到第一批。候选不超过一批时不显示切换动作。

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

Phase 2.2的Today实现将`Plan Freely`与`Use What I Have`作为Nutrition Overview上方的attached tabs。点击tab或swipe只更新`activePlanningMode`，不会触发regenerate；下方Nutrition Overview与Meal Cards读取当前slot。`Generate My Day`、单餐regenerate、lock / unlock和portion edit也只更新当前slot。

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

Phase 1.1默认入口不再直接展示完整营养表单。

## Common / Reference Food

```text
Add Food

[ Search common foods... ]

Common foods

Mushrooms
Vegetable
≈7 kcal / 100g

Broccoli
Vegetable
≈34 kcal / 100g

Egg
Protein
≈131 kcal / 100g

--------------------

Can't find it?

Add packaged or custom food
```

搜索要求：

* 大小写不敏感
* 支持部分匹配
* 输入即时过滤
* 同时匹配name和aliases
* 空搜索固定展示8个热门食品：Egg、Greek Yogurt、Chicken Breast、Mushrooms、Broccoli、Banana、Rice和Pasta
* 有搜索词时按名称前缀、alias前缀、名称包含和alias包含排序，最多展示12项

Quick Add下方提供`Browse all reference foods`入口。Browse模式调用同一个纯数据搜索模块的全量结果路径，不应用12项上限，并支持`all | protein | carb | vegetable | fruit | fat_sauce | composite`分类过滤和静态分类计数。UI selection只保存选中的`referenceFoodId[]`，与当前visible results解耦，因此搜索和分类变化不会清空已选项；Cancel或成功提交负责清空。

选择Reference Food后进入单页极简确认：

```text
Mushrooms
Vegetable · Standard estimate

Nutrition summary

Default serving
[ 100 ] g

☑ In stock
☐ Regular buy
☐ Favourite

Store (optional)
[                    ]

Add to My Foods
```

保存调用统一factory创建独立User Food copy。

重复判断只比较：

```text
referenceFoodId
或规范化后的name
```

命中时显示View existing food与Add anyway，不静默创建重复项。

### Select multiple

Common Foods标题区域提供轻量的`Select multiple`入口。进入多选状态后，搜索和排序仍由同一个Reference Food搜索模块负责；结果使用checkbox或等价选择状态，底部显示`Add N to My Foods` sticky action。

批量创建必须调用统一的Reference → User Food factory，并遵守：

```text
new User Food id
referenceFoodId = Reference Food id
nutrition / tags / compatibleMeals使用独立copy
保留reference source metadata
inStock = false
regularBuy = false
favourite = false
```

批量提交前再次以`referenceFoodId`或规范化name检查当前User Food Library，跳过已存在或同一批次重复的Reference Food。UI中的已存在项显示`Already added`并禁用；Multi Add不提供`Add anyway`。

该流程直接写入同一个Zustand `foods`数组，不创建新的reference selection store、inventory collection或第三套Food Library。单个添加仍使用原有Search → Select → Confirm流程。

批量成功后通过App级短生命周期UI state把实际加入数量返回My Foods，用`aria-live`状态信息反馈。该反馈和Browse selection都不写入Zustand persistence；User Food数据仍由现有`addFoods` action持久化。Foods页面的build-library入口只导航到现有Add Food页面。

## Packaged / Custom Food

用户点击次要入口后，保留Phase 1完整表单：

```text
Name
Category
Brand
Store
Nutrition source
Nutrition basis
Calories / Protein / Carbs / Fat / Fibre
Optional Sugar / Saturated Fat / Salt
Default serving / Serving unit / Grams per unit
In stock / Regular buy / Favourite
Tags / Compatible meals

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

Shopping List

□ Spinach
  Current plan · Saved recipe

□ Greek Yogurt
  Added manually

[ Mark as Bought ]

----------------

Needed for Your Plan

Spinach
Lunch · Needed for your current plan

----------------

Stock Up

Chicken Breast
Regular buy · Breakfast & Lunch

Spinach
Regular buy · Breakfast + Lunch

Eggs
Breakfast · Lunch · Snack

----------------

Discover New Foods

Reference foods not yet in My Foods

[ Add to My Foods ]
```

Missing Ingredients在current plan、generated recipe和saved recipe上下文中即时显示，可加入Shopping List。无法安全映射到当前User Food的Saved Recipe ingredient显示`Stock status unavailable`。

Shop页面只呈现一个My Foods库及其`inStock`状态，不引入第三个库存库。

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
dailyPlans
activePlanningMode
savedRecipes
shoppingItems
```

Phase 2.2的Today相关state与action路由：

```text
dailyPlans.free: DailyPlan | null
dailyPlans.inventory: DailyPlan | null
activePlanningMode: "free" | "inventory"

setActivePlanningMode
→ 只更新activePlanningMode

generateDailyPlan / regenerateMeal / toggleMealItemLock / updateMealItemPortion
→ 只读取和更新dailyPlans[activePlanningMode]
```

模式切换不得隐式调用Generator，也不得覆盖、清空或重算另一模式的plan。

## localStorage持久化版本

当前persist版本为：

```text
V6
```

V2最初引入的Food迁移规则继续保留：

* 原Phase 1 seed food根据id关联到Reference Food，并补充`referenceFoodId`
* 旧的estimated food映射为`manual_estimate`
* 旧的非estimated custom food映射为`package_label`
* 保留已有Food的用户编辑内容和状态
* 不清空localStorage

Phase 1.2的`aliases`与`referenceSourceName` / `referenceSourceId` / `referenceSourceUrl`是可选Food元数据，persist版本继续使用V2。扩展静态Reference Food目录不触发store迁移，也不会把新的starter foods合并进已有用户库。15个starter User Foods只用于没有持久化状态的首次初始化。

Phase 2.1不改变persist schema：Multi Add继续保存到`foods`，Planning Mode继续保存为现有`inventoryOnly: boolean`。

```text
false → Plan Freely
true  → Use What I Have
```

因此Phase 2.1时persist版本仍为V2，不需要新的migration。

Phase 2.2因引入两个mode-specific plan slot而升级为V3。V2 → V3 migration规则：

```text
inventoryOnly = false
→ activePlanningMode = "free"
→ dailyPlans.free = 旧dailyPlan
→ dailyPlans.inventory = null

inventoryOnly = true
→ activePlanningMode = "inventory"
→ dailyPlans.inventory = 旧dailyPlan
→ dailyPlans.free = null
```

迁移必须保留旧`dailyPlan`以及既有Profile、User Foods和recent history。迁移后刷新应同时恢复`dailyPlans.free`、`dailyPlans.inventory`与`activePlanningMode`。

Phase 3A新增`savedRecipes` snapshot persistence，persist版本从V3升级为V4。

Phase 3B新增`shoppingItems`，persist版本从V4升级为V5。Missing Ingredients、Buy Again和Try Something New都是从现有结构化数据即时派生的view model，不保存重复状态。

V4 → V5 migration：

```text
shoppingItems = 旧shoppingItems ?? []
```

迁移必须完整保留：

* Profile
* My Foods / User Foods
* `dailyPlans.free`
* `dailyPlans.inventory`
* `activePlanningMode`
* `savedRecipes`
* recent food / recipe-template history

Phase 4新增显示偏好`locale: "zh-CN" | "en"`，persist版本从V5升级为V6。V5 → V6 migration规则：

```text
locale = isLocale(旧locale) ? 旧locale : "zh-CN"
```

迁移必须完整保留Profile、User Foods、两个mode-specific DailyPlan、active mode、Saved Recipes、Shopping Items与recent history。V6持久化数据只比V5多一个locale；Reference Foods、translation maps与Recipe Template localization仍是只读静态数据，不写入localStorage。

语言切换只执行`setLocale`，不得触发Generator、nutrition recomputation、库存更新、Shopping mutation或Saved Recipe snapshot更新。

Recipe variant refinement增加可选的`MealPlan.techniqueId`与`SavedRecipe.techniqueId`。这是V6内部的向后兼容增量字段，不升级persist版本：旧MealPlan没有techniqueId时选择该composition的默认兼容technique；旧Saved Recipe没有techniqueId时保留并显示原name/instructions snapshot。不得清空或重写旧数据。

## Localization显示架构

轻量i18n目录负责集中管理显示文案，不引入额外运行时框架：

```text
src/i18n/
  translations.ts          # zh-CN / en translation keys
  foodNames.ts             # 161个Reference Food中文显示名
  recipeLocalizations.ts   # 旧Blueprint/Saved Recipe的本地化回退文案
  locale.ts                # t、Intl格式与显示名helper
  useLocale.ts             # React / Zustand adapter
```

页面和组件使用semantic translation keys与display helpers。业务enum、Food ID、referenceFoodId、nutrition values、category matching、template slot和Generator规则全部保持语言无关。

Food名称解析顺序：

```text
reference-linked User Food / Reference Food
→ 按referenceFoodId读取当前locale名称
→ 无映射时fallback现有food.name

custom User Food
→ 始终显示用户输入的food.name
```

Generated Recipe使用`sourceTemplateId + techniqueId + actual ingredients`进入zh-CN/en确定性builder。切换technique只更新name、instructions、cooking time与equipment display，不改变ingredients、portions、nutrition或locks。builder只能引用当前MealPlan中的ingredients，不允许补入油、黄油、芝士、奶油、酱汁或其他不存在食材。

新Saved Recipe snapshot保存具体`techniqueId`并可按当前locale确定性重建display。旧snapshot没有techniqueId时不猜测variant，整体回退保存时的name与instructions。该过程只生成view model，不修改snapshot。

日期使用`Intl.DateTimeFormat(locale)`；数值使用`Intl.NumberFormat(locale)`。`kcal`、`g`、`ml`保留通用单位写法。HTML `lang`、document title与description随locale更新；入口HTML提供mobile viewport、theme color及Apple web app基础meta，但不注册Service Worker、不引入PWA plugin。

---

# 47. 推荐目录

```text
src/

components/
  MealCard.tsx
  NutritionSummary.tsx
  FoodCard.tsx
  FoodSelector.tsx

pages/
  TodayPage.tsx
  FoodsPage.tsx
  AddFoodPage.tsx
  ConfirmCommonFoodPage.tsx
  FoodFormPage.tsx
  RecipesPage.tsx
  ShopPage.tsx
  SettingsPage.tsx

data/
  seedFoods.ts
  referenceFoods.ts
  referenceFoodSearch.ts
  initialFoods.ts
  foodFactory.ts
  foodMigration.ts
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

### Phase 1.1 — Add Food UX Refinement

已完成：

* Common / Reference Food搜索入口
* Search → Select → Confirm快速添加
* Packaged / Custom Food完整表单入口
* Reference Food与User Food分离
* `referenceFoodId`和`nutritionSource`
* 简单重复提示
* Default Serving与Package Size概念区分
* localStorage V2及Phase 1数据迁移

Phase 1.1只优化数据来源和Add Food UX，不改变Phase 2–4范围。

---

### Phase 1.2 — Reference Food Expansion

已完成：

* 161项本地静态Reference Foods，覆盖六类食品
* UK CoFID 2021 / USDA FDC来源名称、记录ID和官方URL元数据
* 英国语境显示名称及aliases搜索
* 固定8项Popular Picks和Quick Search最多12项搜索结果
* Browse All全量搜索、分类计数/筛选和跨筛选批量选择
* 15个仅用于全新安装的starter User Food copies
* V2持久化兼容，既有User Food Library不被覆盖

Phase 1.2不增加运行时API、Meal Generator、Recipe Template、Shopping或库存数量逻辑。

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

### Phase 2.1 — Planning Pool UX

已完成：

* Foods页面明确表示My Foods / User Food Library
* In Stock保持为User Food状态，不拆分第三套食品库
* Common Foods支持Select multiple并批量创建独立User Food copies
* 批量加入默认`inStock = false`，已存在项不可重复选择
* Today以Plan Freely / Use What I Have映射现有`inventoryOnly`
* Plan Freely使用全部User Foods，Use What I Have只使用in-stock User Foods
* 两种模式都不允许Meal Generator直接读取Reference Foods
* V2持久化结构保持不变，无需migration

Phase 2.1不实现精确库存数量、自动扣减、Explore / Try Something New、Shopping或Phase 3功能。Explore / Try Something New留到Shopping / Discovery阶段。

---

### Phase 2.2 — Mode-specific Daily Plans

已完成：

* Today为Plan Freely和Use What I Have分别保存独立DailyPlan
* `activePlanningMode`决定当前展示与操作的plan slot
* tab点击与swipe只切换展示，不自动regenerate
* Generate My Day只覆盖当前active mode
* 单餐regenerate、lock / unlock与portion edit只修改当前active mode
* 未生成的mode显示empty state，不自动生成
* localStorage升级为V3，并安全迁移V2的`dailyPlan`与`inventoryOnly`

Phase 2.2不修改Meal Generator、candidate scoring、recipe templates、nutrition algorithm、Reference/User Food关系，也不开始Phase 3。

---

## Phase 3A — Recipe Experience

已完成：

* Recipe详情
* 动态Ingredient substitution
* Equipment filtering
* Cooking time
* Saved Recipe snapshots

---

## Phase 3B — Shopping

已完成：

* Shopping List
* 根据最新User Food `inStock`即时派生Missing Ingredients
* Needed for Your Plan / 计划所需
* Stock Up / 常备补货
* Discover New Foods / 发现新食材
* Mark as Bought
* Reference-only item购买后创建独立User Food copy
* localStorage V5与V4 → V5 migration

库存继续只使用boolean `inStock`。Phase 3B不实现库存数量、自动扣减或expiry tracking。

---

## Phase 4 — Chinese Localization & Mobile Readiness

已完成：

* 集中的轻量`zh-CN` / `en`translation layer
* Settings语言切换、即时更新与localStorage V6持久化
* 161个Reference Food中文显示名，custom User Food名称原样保留
* 14个Meal Blueprint与13个Cooking Technique的中文/英文确定性文案
* Generated Recipe按blueprint、selected technique与actual ingredients生成当前locale的名称和步骤
* Saved Recipe snapshot不变，并在可安全解析时生成本地化display view
* Today、Foods、Add/Edit Food、Recipes、Recipe Detail、Shop、Settings及所有状态和控件完整本地化
* `Intl`日期与数字格式
* 约390px移动端布局检查和iPhone Add to Home Screen基础meta

## Recipe Variant & Sparse Inventory Refinement

已完成：

* 14个Recipe Templates按Meal Blueprints使用
* 13个通用Cooking Techniques与确定性compatibility
* 同一ingredient composition可产生多个Recipe Variants
* Recipe Detail仅在多种合法做法时显示“换个做法”
* Ingredient Swap后重新校验并在必要时更换technique
* 标准Blueprint为0时才启用Relaxed Composition
* Add/Edit Food数字输入使用string draft，提交时才解析；新建营养字段默认空白
* localStorage保持V6，旧plan与Saved Recipe安全回退

本阶段不修改Nutrition Engine、Meal Generator核心、Shopping recommendation、库存模型或Saved Recipe持久化语义；不增加Service Worker、PWA框架或网络翻译服务。

---

## Future — Natural Language（Deferred / Not included in current V1）

尚未实现：

* Text input
* Rule parser
* Constraint Chips
* Conditional generation
* AI / LLM
* OCR / barcode
* Backend / authentication / cloud

Natural Language的未来产品范围保持不变，但当前V1不包含Natural Language Planning。当前代码不保留任何Parser、Constraint Chips、自然语言UI或相应持久化状态。

当前V1通过Generate、Lock / Unlock、Regenerate、Portion Edit和Ingredient Swap完成可控的meal refinement。

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

□ 可以从Common Food搜索中选择Reference Food并快速确认加入

□ 加入后生成独立User Food，编辑不会修改Reference Food

□ 重复选择同一个Reference Food时会提示View existing或Add anyway

□ Packaged / Custom Food仍可以进入完整表单

□ 旧Phase 1 localStorage数据可以迁移到V2

□ Reference Food总量为161项，且每项包含权威来源元数据

□ mush / cour / zucchini / shrimp / eggplant均能命中预期Reference Food

□ 空搜索只展示8个Popular Picks

□ Browse All可显示全目录、按六类筛选，并在切换搜索/分类后保留已选项

□ 批量加入跳过Already added，默认inStock / regularBuy / favourite均为false

□ 全新安装初始化15个独立的reference-linked User Foods
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
