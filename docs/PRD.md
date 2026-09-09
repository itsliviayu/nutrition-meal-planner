# Personal Meal Planner — V1 PRD

## 1. 产品概述

### 1.1 产品定位

一个面向个人使用的、**营养规则驱动的轻量 Meal Planner**。

产品围绕三个每日饮食场景：

* Breakfast 早餐
* Lunch 中餐
* Evening Snack 晚间小加餐

用户不需要每天自己思考“今天吃什么”，而是维护一个属于自己的食品库和库存，由系统根据：

* 每日热量目标
* 蛋白质目标
* 营养均衡
* 家中现有食材
* 厨具
* 烹饪时间
* 用户临时偏好
* 已锁定的食物

自动生成当天的三餐组合，并提供简单菜谱和购物建议。

核心价值：

> **不是记录我吃了什么，而是提前解决“我今天应该吃什么、怎么搭配、缺什么食材”的问题。**

---

# 2. V1用户

## Primary User

当前首先服务于产品开发者本人。

当前默认档案：

* 身高：171 cm
* 体重：60 kg
* 目标体重：55 kg
* 目标：减脂塑形，同时进行规律力量训练
* 饮食形式：早餐 + 中餐 + 晚间小加餐
* 主要自己做饭
* 厨具：

  * 电磁炉
  * 烤箱
  * 微波炉
  * 冰箱

## Future User

系统结构不能把上述参数写死。

未来用户应可以配置：

* Height
* Weight
* Goal weight
* Goal
* Activity level
* Daily calorie target
* Protein target
* Dietary preferences
* Available cooking equipment

V1不需要：

* 注册
* 登录
* 多用户
* 云端账户

所有信息暂存在本地。

---

# 3. 产品设计原则

## 3.1 “计划”而不是“记录”

产品不做传统 calorie tracker。

不需要用户：

> 早餐吃完 → 记录
> 午饭吃完 → 记录
> 晚上继续记录

而是：

> 今天准备吃什么？

生成的是 **Plan**，而不是 Intake Log。

因此V1不需要：

* 已吃/未吃打卡
* 连续打卡
* 饮食 streak
* “今天还剩347 kcal”
* 红色超标警告

---

## 3.2 精确，但不制造热量焦虑

首页可以显示：

**Today**

1,645 kcal
Target 1,600–1,750 kcal

Protein 91g
Target 80–100g

Fibre 28g
Target ≈30g

Fruit & Veg
5 portions ✓

但不显示：

> ❌ You have 105 kcal left

目标应以：

* 达标
* 接近目标
* 可以改善

表达，而不是把用户引导成不断“吃剩余卡路里”。

---

# 4. 营养科学框架

## 4.1 基本原则

系统不是简单遵循：

> 一餐一个蛋白质 + 一个碳水 + 一个蔬菜

而是根据**整天营养目标**自动组合食物。

英国 NHS Eatwell Guide 强调饮食平衡应从一天乃至一周整体来看，而非要求每一餐机械地满足同样比例。

因此系统有两个层级：

### Level 1：Meal-level rules

保证每顿饭基本合理。

### Level 2：Day-level optimisation

保证一天总体热量、蛋白质、纤维和蔬果结构合理。

Day-level 优先级高于 Meal-level。

---

# 5. 每日营养目标

V1目标值全部应支持设置，而不是写死。

当前个人 Profile 可暂设：

### Energy

目标范围：

**1,600–1,750 kcal/day**

系统判断：

* Below range
* Within range
* Above range

但首页不显示“还剩多少”。

---

### Protein

当前目标：

**80–100 g/day**

对于进行减脂和力量训练的人群，较高蛋白摄入常用于支持饱腹感与瘦体重维持；已有研究综述讨论了约1.2–1.6 g/kg/day以及约25–30g/meal的范围，但这不是所有人的统一医学处方。

因此产品将：

**80–100g**

定义为当前用户的可编辑 Personal Target，而不是“所有成年人都应该如此”。

基础成人蛋白质参考值明显更低，例如 British Nutrition Foundation 给出的成人参考为约0.75g/kg/day。

---

### Fibre

Target：

**≈30 g/day**

英国 SACN 当前成人膳食纤维参考值为约30g/day。

---

### Fruit & Vegetables

Target：

**≥5 portions/day**

通常：

**1 portion ≈ 80g**

目标遵循英国 NHS 5 A Day 建议。

---

# 6. 食品分类体系

注意：

这不是复制 Eatwell Guide 的官方食物分类。

它是为了 Meal Generator 而设计的**产品数据分类**。

## Group A — Protein

例如：

* Eggs
* Greek yogurt
* Skyr
* Cottage cheese
* Chicken breast
* Chicken thigh
* Beef
* Salmon
* Cod
* Tuna
* Shrimp
* Tofu
* Beans

---

## Group B — Carbohydrate / Starch

例如：

* Rice
* Pasta
* Wholemeal toast
* Oats
* Potato
* Sweet potato
* Bagel
* Wrap
* Couscous
* Quinoa

---

## Group C — Vegetables

例如：

* Broccoli
* Spinach
* Mushroom
* Tomato
* Pepper
* Courgette
* Green beans
* Mixed vegetables
* Salad

---

## Group D — Fruit

例如：

* Banana
* Apple
* Blueberries
* Strawberry
* Orange
* Kiwi
* Grapes

---

## Group E — Fat / Sauce / Add-ons

例如：

* Olive oil
* Cheese
* Peanut butter
* Nuts
* Pesto
* Cream sauce
* Mayonnaise
* Dressing

---

## Group F — Composite Food

用于无法合理归入单一组别的食品。

例如：

* Supermarket pizza
* Chicken wrap
* Ready meal
* Lasagne
* Sandwich
* Granola
* Protein bar
* Microwave meal

Composite Food依然保存完整营养数据。

它可以同时贡献：

* Calories
* Protein
* Carbs
* Fat
* Fibre

因此：

> “Composite”只是食品分类，不意味着它在营养计算中被当作一个独立营养素。

---

# 7. Food 数据结构

每个 Food Item 至少包含：

```text
id
referenceFoodId (optional)
aliases (optional; Reference Food search only)

referenceSourceName (optional)
referenceSourceId (optional)
referenceSourceUrl (optional)

name
brand
store

category

nutrition:
  calories
  protein
  carbs
  fat
  fibre (optional when comparable AOAC data is unavailable)

optional:
  saturatedFat
  sugar
  salt

nutritionBasis:
  per100g
  per100ml
  perUnit

defaultServing

unit:
  gram
  ml
  piece

gramsPerUnit

inventoryStatus

favorite

tags:
  highProtein
  highFibre
  quick
  breakfast
  lunch
  snack
  vegetarian
  freezer
  etc.

nutritionSource:
  reference
  package_label
  manual_estimate

fibreSourceMethod (optional):
  AOAC
  NSP
```

`referenceFoodId`只存在于从系统参考食品创建的User Food中，用于记录来源和进行简单重复判断。它不是Food的主键。

系统中的食品数据分为两个层级：

### Reference Food

系统内置的基础食品参考数据，例如Egg、Mushrooms、Broccoli和Banana。

Reference Food：

* 提供标准估算营养数据和默认份量
* 作为Common Food搜索的数据源
* 保存搜索别名和可追溯的营养来源元数据
* 不直接作为用户可编辑的库存记录
* 不因用户修改自己的食品而改变

### User Food

用户个人Food Library中的食品记录。

User Food可以：

* 从Reference Food复制创建
* 通过包装营养表手动创建
* 使用用户自行估算的数据创建
* 独立修改default serving、store和各类状态

---

# 8. 营养数据可信度

系统必须区分：

### Package Label

例如：

Lidl yogurt包装写：

100g：

* 65 kcal
* Protein 10g
* Carb 4g
* Fat 0.5g

则直接使用标签数据。

---

对应：

```text
nutritionSource = package_label
```

---

### Reference Nutrition

例如：

banana
egg
broccoli

使用标准食品参考数据。

UI可以显示：

**≈ 105 kcal**

而不是伪装成：

**104.73 kcal**

对应：

```text
nutritionSource = reference
```

---

### Manual Estimate

如果用户没有包装标签，也没有选择系统Reference Food，但仍希望自行填写估算值：

```text
nutritionSource = manual_estimate
```

UI以中性的“Manual estimate”标识，不把估算来源显示成错误或警告。

---

### 原则

> AI不能直接决定一个食品有多少热量。

营养计算必须来自结构化 Food 数据。

Phase 1.2的Reference Food营养值来自本地静态的UK CoFID 2021数据，缺少合适条目时使用USDA FoodData Central。每条记录保存：

```text
referenceSourceName = UK CoFID 2021 or USDA FoodData Central
referenceSourceId = CoFID Food Code or FDC ID
referenceSourceUrl = official source URL
```

当前Reference Food目录共83项：20 protein、14 carb、23 vegetable、12 fruit、11 fat/sauce和3 composite。82项来自CoFID；为了保持已有`skyr` reference ID有效，Plain Skyr使用USDA FoodData Central记录。CoFID的`Tr`值在数字模型中归一为0。

Daily fibre target的30g/day严格按英国AOAC fibre口径理解。统一`fibre`字段只保存明确可比较的AOAC值，绝不把NSP值直接写入；找不到可靠AOAC值时保留`fibre = undefined`。当前75项有AOAC fibre，8项暂缺。Meal / Daily Nutrition计算只汇总AOAC可比值，`fibreSourceMethod = NSP`或未知值不参与30g target比较。

---

# 9. Add Food

入口：

**Food Library → + Add Food**

Phase 1.1将Add Food分成两条简短路径。

## 9.1 Common / Reference Food Quick Add

用于通常没有包装营养表的天然或基础食品，例如：

* Mushrooms
* Broccoli
* Banana
* Apple
* Egg
* Chicken Breast
* Potato
* Spinach

流程保持为：

```text
Search → Select → Confirm
```

用户搜索并选择Reference Food后，系统直接带出结构化参考营养数据。确认页面只需要显示或允许调整：

* Food name
* Category
* Nutrition summary
* Default serving
* In Stock
* Regular Buy
* Favourite
* Optional Store

用户不需要重新填写Calories、Protein、Carbs、Fat或Fibre。

保存时系统创建一份独立User Food copy，并设置：

```text
referenceFoodId = selected Reference Food id
nutritionSource = reference
```

后续编辑User Food不会修改Reference Food。

如果用户库中已经存在同名食品或相同`referenceFoodId`，系统提示：

```text
{Food name} is already in your food library.
```

并提供：

* View existing food
* Add anyway

## 9.2 Packaged / Custom Food Manual Entry

Common Food搜索结果下方提供次要入口：

**Add packaged or custom food**

只有包装食品或自定义食品进入完整营养表单。V1手动填写：

### Required

* Food name
* Category
* Nutrition source
* Nutrition basis
* Calories
* Protein
* Carbs
* Fat
* Fibre
* Default serving
* Serving unit

### Optional

* Sugar
* Saturated fat
* Salt
* Brand
* Store
* Grams per unit（需要单位换算时）
* Favourite
* In stock
* Regular buy
* Tags

另外至少选择一个compatible meal。

例如：

**Milbona High Protein Yogurt**

Category
Protein

Per 100g

Calories 65
Protein 10g
Carbs 4g
Fat 0.5g

Default serving
200g

Store
Lidl

包装标签数据保存为：

```text
nutritionSource = package_label
```

如果数据是用户自行估算，则保存为：

```text
nutritionSource = manual_estimate
```

## 9.3 Default Serving不是Package Size

`defaultServing`表示：

> 生成餐食时通常使用多少。

它不表示包装净含量。

例如Mushrooms包装为200g，并不意味着默认份量必须是200g。V1暂不增加package size字段，也不追踪剩余克数、库存扣减或包装数量。

## 9.4 Phase 1.2 Reference Food搜索范围

Common Food搜索覆盖全部83个本地Reference Foods。搜索支持：

* 大小写不敏感
* 名称部分匹配
* alias部分匹配
* 英国语境主名称及常见同义词，例如Courgette / zucchini、Prawns / shrimp、Aubergine / eggplant、Spring Onion / scallion / green onion和Yogurt / yoghurt

alias只用于搜索，不在普通UI中展示。空搜索固定只显示8个Popular Picks：Egg、Greek Yogurt、Chicken Breast、Mushrooms、Broccoli、Banana、Rice和Pasta。

全新安装初始化15个User Foods。它们通过Reference Food factory创建独立copy；已存在的localStorage Food Library不会被补写、替换或重新初始化。未来Meal Generator只允许读取User Food Library，不直接读取Reference Food目录。

---

# 10. V1.1：拍营养表识别

注意：本节是未来OCR / Vision候选功能，不属于已经完成的“Phase 1.1 — Add Food UX Refinement”。当前Add Food不会联网，也不会进行AI或拍照识别。

后续增加：

**Scan Nutrition Label**

流程：

拍包装营养表

↓

OCR / Vision

↓

生成结构化字段

↓

展示确认页面

↓

用户确认

↓

加入 Food Library

AI识别结果不能直接静默保存。

必须经过：

**Review & Confirm**

避免识别错误影响后续计算。

---

# 11. Inventory 食品库存

Food Library中的食品可设置：

### In Stock

家里现在有。

### Regular Buy

经常购买。

### All Foods

整个个人数据库。

V1库存状态仍然只是`inStock = true / false`。不记录package size、剩余重量、包装数量或使用后的自动扣减。

---

用户随机生成菜单时可以开启：

**Use ingredients I already have**

开启后：

Hard Constraint：

> 生成餐食优先只使用 `inStock = true` 食材。

---

# 12. Today 首页

首页是整个产品的核心。

页面顶部：

## Today

Wednesday · 9 Sep

### Nutrition Overview

**1,645 kcal**
Within target

**Protein 91g**
Target 80–100g ✓

**Fibre 28g**
Close to target

**Fruit & Veg 5 portions**
✓

状态尽量使用：

* Good
* Close
* Could improve

避免：

* Failed
* Bad
* Overeaten

---

# 13. Meal Card

首页包含三张卡：

## Breakfast

例如：

**Eggs + Toast + Greek Yogurt + Blueberries**

430 kcal
Protein 29g

食物分别显示：

🔒 Eggs — 2
🔓 Toast — 2 slices
🔓 Greek Yogurt — 150g
🔓 Blueberries — 80g

操作：

**Recipe**

**Edit**

**Regenerate**

---

## Lunch

例如：

**Creamy Chicken Mushroom Pasta**

620 kcal
Protein 42g

---

## Evening Snack

例如：

**Skyr + Banana + Almonds**

230 kcal
Protein 20g

---

# 14. 核心功能：Generate My Day

首页主按钮：

# 🎲 Generate My Day

点击后生成：

Breakfast
+
Lunch
+
Evening Snack

不是三顿分别随机。

系统应从**整日营养目标**反推三餐组合。

---

# 15. Meal Generator

生成器的核心不是纯随机。

应该采用：

> Constraints → Candidate Generation → Nutrition Calculation → Scoring → Random Selection

---

## Step 1：读取 Hard Constraints

例如：

Meal Type = Lunch

Available equipment:

* hob
* oven
* microwave

Maximum cooking time:

20 min

Inventory only:

true

Excluded:

rice

Locked ingredient:

chicken

---

## Step 2：生成候选组合

例如：

Chicken
+

Pasta / Potato / Wrap

*

Broccoli / Mushroom / Spinach

*

Sauce

---

## Step 3：计算营养

每一种组合计算：

* Calories
* Protein
* Carbs
* Fat
* Fibre
* Fruit/veg portions

---

## Step 4：判断当天剩余餐结构

例如已经有早餐：

450 kcal
28g protein

系统不会单独问：

> 午饭是否完美？

而会考虑：

> 午饭 + 晚间加餐以后，整天能否落在目标区间？

---

# 16. Generator Hard Constraints

必须满足：

* Locked food不得删除
* Excluded food不得出现
* Allergy food不得出现
* Equipment必须可完成
* Cooking time不得明显超过限制
* Inventory Only开启时不得使用缺货食材
* 营养目标不能严重偏离

---

# 17. Generator Soft Constraints

可以作为评分：

### Nutrition Fit

40%

### Ingredient Compatibility

20%

### Inventory Usage

15%

### Variety

10%

### User Preference

10%

### Convenience

5%

最终不是：

> 永远选择得分最高的组合

而是：

> 从 Top Candidates 中进行 weighted random selection

这样每次点击才真的有“随机菜单”的感觉。

---

# 18. Lock + Randomise

这是V1核心交互之一。

例如当前午餐：

Chicken
Rice
Broccoli
Teriyaki Sauce

用户锁定：

🔒 Chicken

然后：

**Regenerate**

系统只能替换：

Rice
Broccoli
Sauce

例如变成：

Chicken
Pasta
Spinach
Tomato Sauce

---

也可以锁定：

🔒 Chicken
🔒 Pasta

只重新生成：

Vegetables + Sauce。

---

# 19. Natural Language Generation

输入框：

**Tell me what you feel like eating**

例如：

> 中午想吃鸡肉，20分钟以内，不要米饭，最好用我冰箱里有的。

系统转成：

```text
meal = lunch

include:
  chicken

exclude:
  rice

maxCookingTime:
  20

inventoryOnly:
  true
```

然后调用同一个 Meal Generator。

---

# 20. Natural Language 功能难度

V1并不需要真正的“AI Agent”。

支持一组常用意图即可：

### 时间

* 10分钟以内
* 快一点
* 不想做复杂的

### 食物

* 想吃鸡肉
* 想吃意面
* 想吃点甜的

### 排除

* 不要米饭
* 不想吃鸡蛋

### 库存

* 只用家里的东西

### 营养

* 今天想多吃蛋白质
* 想吃轻一点

### 烹饪

* 不想开烤箱
* 只想用微波炉

---

实现难度：

**低—中等。**

V1甚至可以先用：

关键词 + rule parser

例如：

`鸡肉 → chicken`

`不要米饭 → exclude rice`

`20分钟 → maxTime = 20`

解析成功后，将条件显示成 Chips：

`Chicken`

`≤20 min`

`No Rice`

`In Stock Only`

用户可以删除任何Chip。

因此即使自然语言解析出错，也非常容易修正。

---

# 21. AI版本的自然语言

V1.1可以让LLM完成：

Natural Language

↓

Structured JSON

例如：

```json
{
  "mealType": "lunch",
  "include": ["chicken"],
  "exclude": ["rice"],
  "maxTime": 20,
  "inventoryOnly": true
}
```

但LLM到此结束。

**LLM不得负责最终营养计算。**

---

# 22. Recipe System

菜谱不是提前把所有可能组合写死。

采用：

# Recipe Family + Ingredient Slots

例如：

## Creamy Pasta

需要：

* Protein
* Pasta
* Vegetable
* Cream Sauce

允许：

Protein：

Chicken / Shrimp / Salmon

Vegetable：

Mushroom / Spinach / Broccoli

于是同一个 Recipe Family 可以生成：

Chicken Mushroom Creamy Pasta

Shrimp Spinach Creamy Pasta

Salmon Broccoli Creamy Pasta

---

# 23. 动态 Recipe

Generator确定：

Chicken 140g
Pasta 75g
Mushroom 100g
Spinach 80g
Cream Sauce 50g

之后系统生成：

### Ingredients

* Chicken breast 140g
* Pasta 75g
* Mushroom 100g
* Spinach 80g
* Cream sauce 50g

### Equipment

Hob

### Time

≈18 min

### Method

1. Boil pasta.
2. Cut and cook chicken.
3. Add mushrooms and spinach.
4. Add cream sauce.
5. Add cooked pasta and combine.

---

# 24. AI与Recipe的边界

未来如果接入LLM：

系统先确定：

**食物 + 克数 + 营养数据**

AI只负责把这些信息变成：

* 简单烹饪步骤
* 调味建议
* 更自然的菜谱说明

AI不能突然：

* 多加50g cheese
* 加大量olive oil
* 改变portion

除非它同时返回结构化Ingredient Change并重新经过营养引擎计算。

---

# 25. Recipe Tags

每个Recipe应保存：

Cooking time

例如：

`10 min`
`20 min`
`30 min`

Equipment：

`Hob`

`Oven`

`Microwave`

Convenience：

`One Pan`

`No Cooking`

`Meal Prep`

Meal：

`Breakfast`

`Lunch`

`Snack`

---

# 26. Portion Adjustment

用户可以直接：

**Pasta**

`−  75g  +`

修改为：

65g

系统立即重新计算：

Calories
Protein
Carbs
Fat
Fibre

并重新评价整日Plan。

---

# 27. Food Library 页面

Bottom Navigation：

**Today**

**Foods**

**Recipes**

**Shop**

---

Food Library顶部：

Search

Filters：

`All`

`Protein`

`Carbs`

`Vegetables`

`Fruit`

`Fat & Sauce`

`Composite`

进一步Filter：

`In Stock`

`Regular Buy`

`Favourite`

`Lidl`

`Tesco`

等。

---

# 28. Recipes 页面

显示：

## Suggested for you

基于：

* Inventory
* Nutrition targets
* Cooking equipment
* Preparation time

---

## Recipe Categories

Quick Meals

High Protein

Pasta

Rice

Oven Meals

Breakfast

No-Cook

---

用户点击某一道菜：

**Creamy Chicken Pasta**

可以：

### Make This

将其加入今天Lunch。

### Randomise Ingredients

鸡肉可以变成虾等。

### What do I need?

进入购物功能。

---

# 29. Shopping 功能

购物功能解决两个问题。

## Problem A

> 我想做这个菜，但不知道缺什么。

## Problem B

> 我现在去Lidl，但根本不知道应该买什么才能支持接下来随机搭配。

---

# 30. Recipe Shopping List

例如选择：

Creamy Chicken Pasta

现有库存：

Chicken ✓
Pasta ✓

缺：

Mushroom
Spinach
Cream Sauce

系统显示：

# You Need

□ Mushroom
□ Spinach
□ Cream Sauce

点击：

**Mark as bought**

食品自动：

`inStock = true`

---

# 31. Smart Shopping Recommendations

页面：

# Good Things to Buy

系统根据 Food Library + Recipe Library计算：

### Very Versatile

Chicken breast

Used in 12 recipes

### Very Versatile

Eggs

Used in 10 recipes

### Recommended

Spinach

Used in 8 recipes

### Recommended

Greek Yogurt

Breakfast + Snack

---

算法可以简单设计：

```text
Shopping Score =

Recipe Frequency
×
Meal Versatility
×
Nutrition Value
×
Personal Preference
```

库存已有食品降低推荐权重。

---

# 32. “高频食材”价值

用户不需要先知道这一周做什么。

系统可以告诉用户：

> 如果今天去Lidl，只买6样东西，最值得买的是：

Eggs
Greek yogurt
Chicken
Spinach
Mushrooms
Bananas

因为这些食材可以组成最多有效Meal Combinations。

这会成为产品非常有辨识度的功能。

---

# 33. Composite Food处理

例如用户录入：

**Tesco Margherita Pizza**

整个pizza：

780 kcal
Protein 30g
etc.

如果今天Lunch选择：

½ Pizza

系统计算：

390 kcal。

但是Generator可能判断：

Protein不足
Vegetables不足

于是自动搭配：

½ Pizza
+

Chicken

或

Large salad

从而把“披萨”纳入真实生活，而不是简单把它定义为：

> 不健康食品，不允许吃。

---

# 34. Homepage Complete Flow

用户打开网站。

看到：

# Today

Nutrition Overview

↓

Breakfast

↓

Lunch

↓

Evening Snack

↓

**Generate My Day**

---

第一次生成：

系统给出整日Plan。

如果早餐满意：

🔒 Eggs
🔒 Toast

不喜欢Greek Yogurt：

点击：

**Regenerate Unlocked**

---

午饭想吃Chicken：

输入：

> 想吃鸡肉，不要米饭，20分钟搞定。

系统识别条件。

重新生成Lunch。

---

系统重新优化晚间Snack，使全天营养重新接近目标。

---

# 35. V1 页面架构

只做5个页面：

### 1. Today

核心每日规划。

### 2. Food Library

食品数据库 + 库存。

### 3. Add/Edit Food

Common Food通过Search → Select → Confirm快速加入；Packaged / Custom Food使用完整营养表单；已有User Food可以继续编辑。

### 4. Recipes

查看和生成Recipe。

### 5. Shopping

缺失食材 + 高频购买建议。

Settings作为右上角入口，不需要单独Bottom Tab。

---

# 36. Settings

包含：

## My Profile

Height
Weight
Goal Weight

## Nutrition Targets

Calories

Protein

Fibre

Fruit & Veg

## Equipment

☑ Hob
☑ Oven
☑ Microwave

## Preferences

Maximum default cooking time

Favourite foods

Excluded foods

---

# 37. 数据持久化

V1：

**localStorage**

当前持久化schema版本：

```text
V2
```

V2增加`referenceFoodId`和`nutritionSource`，并支持将Phase 1已保存的Food数据自动迁移，不清空或覆盖用户已有食品。

Phase 1.2新增的`aliases`和reference source字段为可选元数据，因此persist版本保持V2，不需要新的localStorage migration。Reference Food目录扩展只影响静态搜索源和全新安装的starter foods。

保存：

* Profile
* Foods
* Inventory
* Recipes
* Today Plan
* Settings

暂时不需要：

* Account
* Authentication
* Database
* Cloud Sync

---

# 38. 推荐技术栈

为了降低Vibe Coding成本：

### Frontend

React

TypeScript

Vite

### State

Zustand

### Persistence

localStorage

### Styling

可选：

Tailwind CSS

或者普通CSS Modules。

---

# 39. V1自然语言实现

建议第一版：

**不接LLM API。**

采用：

Natural language input

↓

Local parser

↓

Constraint Chips

↓

Meal Generator

优点：

* 不需要后端
* 不需要API Key
* 无费用
* 更稳定
* 很容易debug

等整个Planner逻辑稳定，再加LLM。

---

# 40. 为什么暂时不直接在Frontend接LLM

如果直接在浏览器代码中写：

OpenAI / Claude API Key

Key容易暴露。

因此未来真正加入LLM时更合理的是：

Frontend

↓

small serverless function

↓

LLM API

↓

structured constraints

这属于V1.1，而不是第一天就做。

---

# 41. V1优先级

## P0 — 必须完成

* Today首页
* 三餐结构
* 六类食品
* Food Library
* 手动录入Food
* Nutrition calculation
* Portion adjustment
* Daily Nutrition Overview
* Generate My Day
* Meal-level regenerate
* Lock ingredient
* Inventory
* Recipe families
* Recipe ingredients
* Recipe steps
* Cooking equipment constraint
* Cooking-time constraint
* localStorage

---

## P1 — V1最好有

* Natural language condition parser
* Constraint Chips
* Shopping List
* High-frequency ingredient recommendations
* Favourite foods
* Store标签
* Composite foods

---

## P2 — V1.1

* AI nutrition-label recognition
* LLM natural-language parsing
* AI-generated recipe wording
* Automatic nutrition database
* Automatic calorie-target estimation

---

# 42. V1明确不做

* Login
* Account
* Cloud sync
* Social
* Community
* Calorie diary
* Weight diary
* Exercise tracking
* Photo food recognition
* Barcode scanner
* AI medical advice
* Micronutrient全面追踪
* Meal delivery
* Grocery price comparison

---

# 43. V1核心验收标准

### Scenario 1

用户可以在Food Library添加一个食品，并填写：

Calories
Protein
Carbs
Fat
Fibre
Serving size

保存后重新打开页面数据仍存在。

---

### Scenario 2

点击：

**Generate My Day**

系统能够生成：

Breakfast
Lunch
Evening Snack

且全天营养尽量落入设置的目标区间。

---

### Scenario 3

用户锁定：

Chicken

重新随机Lunch。

Chicken必须继续存在。

---

### Scenario 4

用户选择：

Inventory Only

系统不会随机生成不在库存中的普通食材。

---

### Scenario 5

用户输入：

> 中午想吃鸡肉，20分钟以内，不要米饭。

系统解析出：

Chicken
≤20 min
No Rice

并显示为可编辑Condition Chips。

---

### Scenario 6

用户将：

Pasta 75g

修改为：

Pasta 60g

Calories和Macronutrients立即重新计算。

---

### Scenario 7

点击Lunch的：

**Recipe**

能够看到：

Ingredients
Amounts
Cooking Time
Equipment
Steps

---

### Scenario 8

用户选择一个Recipe并点击：

**What do I need?**

系统只列出库存中没有的Ingredient。

---

### Scenario 9

Shopping页面能够根据Recipe Library计算高频通用食材，并优先推荐：

高使用率
高搭配可能性
当前缺货

的食品。

---

# 44. 产品最核心的三个差异点

V1开发过程中不要偏离这三件事。

## ① Nutrition-aware Randomisation

不是：

> 随机抽几个食物。

而是：

> 在营养目标约束下随机生成真正可吃的一天。

---

## ② Lock & Regenerate

用户永远可以表达：

> 这个我想吃，其他你帮我想。

这是产品最重要的交互。

---

## ③ Pantry → Meal → Shopping 闭环

家里有什么

↓

今天能做什么

↓

我想吃什么

↓

还缺什么

↓

什么东西最值得买

形成：

**Food Library → Inventory → Meal Generation → Recipe → Shopping**

的完整闭环。

---

# 45. V1核心产品定义

最终可以用一句话描述：

> **A nutrition-aware personal meal planner that turns the food you have—and what you feel like eating—into a balanced daily meal plan, simple recipes, and a smarter shopping list.**

中文：

> **一个基于营养目标、个人库存和临时饮食偏好，自动生成每日餐食、简单菜谱和购物建议的个人饮食规划工具。**
