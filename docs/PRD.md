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
ingredientKind (optional on persisted User Food; required on Reference Food)

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

`FoodCategory`表示营养与餐食结构分类；`IngredientKind`表示食材的烹饪身份。当前结构化类型包括egg、cooked/raw meat、fish/seafood、tofu/legume、yogurt/dairy、cheese、milk、bread、pasta、rice、noodles、wrap、oats、potato、grain、cereal、vegetable、fruit、sauce、spread、oil/fat、composite及保守的other类型。系统不根据`name`猜测类型。

系统中的食品数据分为两个层级：

### Reference Food

系统内置的基础食品参考数据，例如Egg、Mushrooms、Broccoli和Banana。

Reference Food：

* 提供标准估算营养数据和默认份量
* 作为Common Food搜索的数据源
* 保存搜索别名和可追溯的营养来源元数据
* 每一项都通过category default + explicit override获得明确的`IngredientKind`
* 不直接作为用户可编辑的库存记录
* 不因用户修改自己的食品而改变

### User Food

用户个人Food Library中的食品记录。

产品中的Food Library页面展示的是**My Foods / User Food Library**，不是系统完整的Reference Food Library。`In Stock`只是每条User Food上的当前库存状态，不是独立的第三个Food Library。

User Food可以：

* 从Reference Food复制创建
* 通过包装营养表手动创建
* 使用用户自行估算的数据创建
* 独立修改name、brand、store、default serving、状态、tags和compatible meals
* 继承Reference Food的`IngredientKind`，并可在自己的copy上覆盖而不修改Reference Food
* 在保留`referenceFoodId`来源关系的同时，把营养来源切换为`package_label`或`manual_estimate`

`referenceFoodId`表达“这条User Food源自哪个系统参考食品”，不表示User Food必须永远使用系统名称或reference nutrition。Reference Food始终只读；User Food的身份、规划偏好和营养来源分别保存，后续编辑任何User Food都不会回写或污染Reference Food。

Custom / packaged Food表单在Category后显示按当前category过滤的`Ingredient type / 食材类型`。该字段只影响菜品组合与做法，不修改营养数据。旧V6 User Food可以没有显式字段；运行时按“User Food显式值 → `referenceFoodId`对应Reference Food → FoodCategory保守默认”取得effective IngredientKind，不做名称推断。

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

### Reference-linked User Food编辑规则

当User Food仍使用`nutritionSource = reference`时，完整表单允许编辑名称、品牌、商店、默认份量、库存状态、常购、收藏、tags和compatible meals，但reference nutrition数值与nutrition basis只读。用户可以明确切换到Package label或Manual estimate后填写自己的营养数据；该操作保留`referenceFoodId`，因此来源关系不会因营养来源改变而丢失。

对于仍有关联Reference Food的User Food，界面提供`Use reference nutrition`。该操作恢复Reference Food的官方nutrition、nutrition basis、营养来源与fibre/source metadata，同时保留用户自己的名称、品牌、商店、default serving、状态、tags和compatible meals。

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

当前Reference Food目录共161项：41 protein、29 carb、41 vegetable、22 fruit、22 fat/sauce和6 composite。160项来自CoFID；为了保持已有`skyr` reference ID有效，Plain Skyr使用USDA FoodData Central记录。CoFID的`Tr`值在数字模型中归一为0。

Daily fibre target的30g/day严格按英国AOAC fibre口径理解。统一`fibre`字段只保存明确可比较的AOAC值，绝不把NSP值直接写入；找不到可靠AOAC值时保留`fibre = undefined`。当前134项有AOAC fibre，27项暂缺。Meal / Daily Nutrition计算只汇总AOAC可比值，`fibreSourceMethod = NSP`或未知值不参与30g target比较。

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

确认页同时提供两个明确动作：

* `Add to My Foods`：使用当前极简确认值直接创建User Food copy
* `Add & Customize`：打开完整Food Form，并以所选Reference Food建立一份尚未保存的draft

`Add & Customize`不会在进入表单时写入My Foods；只有用户提交表单后才创建User Food，取消或返回不会留下半成品记录。

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
* Create customized copy

普通Quick Add和Multi Add继续执行严格重复检查，不静默创建相同Reference Food。只有用户明确选择`Create customized copy`或`Add & Customize`并提交完整表单时，才允许创建具有相同`referenceFoodId`的第二条User Food；每条copy拥有独立`id`和独立可变数据。

### Select multiple

Common Foods同时支持轻量的批量加入模式：

```text
Food Library
→ Add Food
→ Common Food Search
→ Select multiple
→ Add N to My Foods
```

多选继续复用相同的Reference Food名称、alias、大小写不敏感和部分匹配搜索。已经存在于My Foods中的Reference Food显示为`Already added`，且在批量模式下不可再次选择。

批量保存时，每个选中项都通过统一factory创建独立User Food copy，并保留`referenceFoodId`、reference nutrition和来源元数据。批量加入表示“用户愿意吃、会买、允许用于未来规划”，不表示这些食品当前都在家中，因此默认：

```text
inStock = false
```

批量添加不增加额外确认页面；原有单个`Search → Select → Confirm`流程和确认页状态设置保持不变。

### Browse All Reference Foods

Add Food同时提供轻量的`Browse all reference foods`入口，用于首次快速建立较完整的My Foods。Browse All展示完整161项本地目录，并提供All、Protein、Carbs、Vegetables、Fruit、Fat & Sauce和Composite Food分类筛选与对应数量。

Browse All沿用即时搜索与批量选择；搜索不截断为12项。用户跨分类、搜索或清空搜索时，已选`referenceFoodId`继续保留，只有Cancel或成功加入后才清空。已经存在于My Foods的食品显示`Already added`并禁用。成功后返回My Foods并显示简短的加入数量反馈。

Foods / My Foods页面提供轻量的“Browse and build your food library”入口。该入口仍进入同一个Add Food体验，不创建第三套Food Library或单独的持久化selection状态。

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

Common Food搜索覆盖全部161个本地Reference Foods。搜索支持：

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

Food Library即My Foods / User Food Library，其中的食品可设置：

### In Stock

家里现在有。

### Regular Buy

经常购买。

### All Foods

整个个人数据库。

Inventory不是独立的第三个Food Library。它只是User Food上的`inStock = true / false`状态。V1不记录package size、剩余重量、包装数量，也不在生成餐食后自动扣减库存。

---

Reference Food进入规划池的唯一方式是先通过Quick Add或Multi Add创建User Food：

```text
Reference Food Library
→ Quick Add / Multi Add
→ My Foods / User Food Library
→ In Stock status
→ Meal Generator
```

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

## Planning Mode

Today的Nutrition Overview上方提供两个互斥模式：

### Plan Freely

使用全部My Foods / User Foods，包括`inStock = true`和`inStock = false`：

```text
inventoryOnly = false
```

Plan Freely只扩大到用户已经认可并加入My Foods的食品，绝不直接从Reference Food Library生成。

### Use What I Have

只使用My Foods中当前`inStock = true`的食品：

```text
inventoryOnly = true
```

这是Meal Generator已有库存Hard Constraint的用户界面表达，不创建第二套Generator。

`Plan Freely`是默认模式。Phase 2.1曾以`inventoryOnly`持久化模式选择；Phase 2.2按下述双DailyPlan模型升级。

### Phase 2.2 — Mode-specific Daily Plans

Today为同一天维护两份互相独立的DailyPlan：

```text
dailyPlans.free
→ Plan Freely的DailyPlan

dailyPlans.inventory
→ Use What I Have的DailyPlan
```

当前展示模式由以下状态决定：

```text
activePlanningMode = "free" | "inventory"
```

点击顶部mode或左右swipe时，只切换`activePlanningMode`并展示`dailyPlans[activePlanningMode]`。切换本身不得自动regenerate、覆盖另一模式的plan、删除另一模式的plan，或重置其中的lock与portion edits。

`Generate My Day`只重新生成当前active mode对应的DailyPlan：

```text
activePlanningMode = "free"
→ inventoryOnly = false
→ 写入dailyPlans.free

activePlanningMode = "inventory"
→ inventoryOnly = true
→ 写入dailyPlans.inventory
```

单餐regenerate、lock / unlock与portion edit同样只作用于当前active mode的plan，另一模式的plan必须保持不变。

如果`dailyPlans[activePlanningMode]`尚未生成，Today显示该模式的empty state和`Generate My Day`操作，不自动创建plan。

`Explore / Try Something New`不属于Meal Generator，也不是第三个Planning Mode。它留到Shopping / Discovery阶段，用于从尚未加入My Foods的Reference Foods中发现新选择。

---

# 15. Meal Generator

生成器的核心不是纯随机。

应该采用：

> User Food → Food Category → Ingredient Kind → Derived Recipe Roles → Meal Blueprint → Cooking Technique → Nutrition Calculation → Candidate Scoring → Recipe Variant

Ingredient Semantics完全来自结构化字段与既有tags，并以确定性规则派生，不使用AI或自由文本名称推断。

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

生成器先使用14个标准Meal Blueprints匹配完整结构。Blueprint的关键identity slot使用IngredientKind，因此完全Custom的pasta、rice、wrap或oats也可进入对应结构。只有标准候选为0时，才进入Relaxed Composition，以meal type、FoodCategory、IngredientKind、派生Recipe Roles、meal compatibility和tags组合更少但仍合理的食材，并要求至少一个语义合法且兼容的Cooking Technique。

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
* Use What I Have开启时不得使用`inStock = false`的User Food
* 任何Planning Mode都不得直接使用未加入My Foods的Reference Food

Nutrition Fit属于排序信号，不是把合理候选全部清零的Hard Constraint。尤其在稀疏库存下，应如实生成可吃的一餐并在Nutrition Overview显示偏低或偏高。

---

# 17. Generator Soft Constraints

可以作为评分：

### Nutrition Fit

40%

### Structural Fill

5%

### Culinary Semantic Fit

20%

### Inventory Usage

15%

### Variety

5%

### User Preference

10%

### Convenience

5%

最终不是：

> 永远选择得分最高的组合

而是：

> 从 Top Candidates 中进行 weighted random selection

这样每次点击才真的有“随机菜单”的感觉。

初次生成继续在高分候选中进行weighted-random选择。单餐Regenerate则将`recipeTemplateId / blueprint + techniqueId + ingredient foodIds`视为一个完整meal variant：候选照常生成和评分，但只要存在其他合法候选，就必须排除当前variant；若有多个替代项，优先选择该餐次最近1–2次Regenerate未展示的variant，所有替代项用尽后才允许重新出现。该短期轮换历史按planning mode和meal type隔离。

如果当前约束下只有一个合法variant，保留现有餐食并显示简短说明，不伪装成已经换餐。Locked ingredients、planning mode、stock、equipment与cooking time约束继续照常生效。

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

# 19. Natural Language Planning（Deferred）

Natural Language Planning不包含在当前V1中。以下内容保留为未来版本的产品设想，不代表当前已实现或当前开发范围。

当前V1使用以下结构化交互完成可控的meal refinement：

* Generate My Day
* Meal-level Regenerate
* Lock / Unlock ingredient
* Portion Edit
* Recipe Detail中的Ingredient Swap

未来如果重新启用Natural Language Planning，可考虑输入框：

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

# 20. Natural Language 未来功能范围（Deferred）

当前V1不实现Natural Language parser、Constraint Chips或自然语言条件生成。

未来版本如实现，可先支持一组常用意图：

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

预计实现难度：

**低—中等。**

未来第一版可以先用：

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

# 21. AI版本的自然语言（Future）

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

V1采用确定性的Ingredient Semantics + Recipe架构：

```text
User Food
→ FoodCategory + IngredientKind
→ Derived Recipe Roles / Cooking Capabilities
→ Meal Blueprint（现有RecipeTemplate兼容名称）
→ Compatible Cooking Techniques
→ Recipe Variant
```

14个既有templates作为Meal Blueprints保留，负责meal type、required/optional ingredient slots、category/tag compatibility和基本serving structure，不再把一组ingredients绑定为唯一做法。

Cooking Technique按通用烹饪方式定义，而不是按具体食物配对扩张。当前包括scramble、omelette、pan sear、stir fry、boil and assemble、toast topping、cold assemble、oven roast、pasta toss、rice bowl assemble、wrap fill、yogurt bowl和oat bowl。

Recipe Roles（base、main protein、filling、topping、mix-in、side、sauce、liquid）与ready-to-eat、pan、stir-fry、oven、cold-assembly capabilities由IngredientKind、FoodCategory和tags即时派生，不作为重复状态持久化。

Technique compatibility由actual User Foods、IngredientKind、派生semantics、FoodCategory、tags、blueprint slots、meal type、equipment和max cooking time确定。pasta、rice、bread、wrap、yogurt、oats与egg等主要身份检查不再依赖固定food ID。禁止使用LLM判断，也不得加入MealPlan中不存在的油、黄油、芝士、奶油或酱料。

---

# 23. 动态 Recipe

Generator确定ingredients、portions、blueprint与selected technique。例如同一组Egg + Spinach + Toast可以派生scramble、omelette或toast topping variant；切换variant不改变ingredients、portions、nutrition、locks或planning mode。

例如一个variant确定：

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

Phase 3B已完成以下Shopping能力：

* Shopping List
* Missing Ingredients
* Needed for Your Plan / 计划所需
* Stock Up / 常备补货
* Discover New Foods / 发现新食材
* Mark as Bought

Shopping继续沿用两层食品模型：Reference Food是系统只读参考数据，My Foods / User Food Library是用户认可并允许Meal Planner使用的食品。`In Stock`仍然只是User Food上的boolean状态，不创建第三套Food Library。

当前库存模型只回答“有没有”，不回答“有多少”。Phase 3B不记录库存数量、已购买数量、package size，不自动扣减库存，也不追踪expiry date。

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

## Missing Ingredients

Missing Ingredients不作为独立状态保存，而是根据当前My Foods中对应User Food的`inStock`即时派生：

```text
inStock = false → missing
inStock = true  → available
```

Generated Recipe使用ingredient的`foodId`匹配当前User Food。

Saved Recipe保存的是ingredient snapshot。判断当前库存时：

1. 优先使用`foodId`匹配当前User Food
2. 如果原User Food已被重新创建，则使用可选`referenceFoodId`匹配
3. 无法安全匹配时不根据名称猜测，显示`Stock status unavailable`

无法匹配的Saved Recipe ingredient仍可由用户手动加入Shopping List，但系统不声称知道其库存状态。

## Shopping List

Shopping List只保存用户明确准备购买的结构化食品记录。来源可以是：

* current plan
* generated recipe
* saved recipe
* manual（从My Foods手动加入）

Shopping Item优先以明确的User Food `foodId`识别。同一User Food来自多个位置时合并来源而不重复展示；两个拥有相同`referenceFoodId`但不同`foodId`的自定义User Food variant保持为独立条目，避免把不同品牌、名称或营养版本误合并。

`Mark as Bought`采用简单完成方式：

```text
已有User Food
→ inStock = true
→ 移除对应shopping record

Reference-only item
→ 创建独立User Food copy
→ 保留referenceFoodId
→ inStock = true
→ 移除对应shopping record
```

匹配顺序是：精确`foodId`优先；没有`foodId`时，只有`referenceFoodId`在My Foods中唯一命中才可更新该User Food。若同一Reference Food已有多个User Food variants且Shopping Item没有精确`foodId`，界面显示无法安全选择并禁用Mark as Bought，不随机修改任意一条，也不额外创建第三条copy。

移除Shopping Item只删除shopping record，不删除My Foods中的User Food。

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

当前Shopping信息架构在Shopping List下方明确分为三个职责不同的区域。

## 计划所需 / Needed for Your Plan

只读取`dailyPlans[activePlanningMode]`，收集当前plan实际使用且对应User Food为`inStock = false`的食品。Breakfast、Lunch和Snack之间按User Food去重，同时保留它用于哪些meal。这个集合不使用recommendation score。

没有active DailyPlan时显示引导生成计划的empty state；已有plan但没有缺货时显示全部备齐。加入Shopping List后继续使用现有`current_plan`来源和去重语义。

## 常备补货 / Stock Up

候选严格来自：

```text
My Foods AND inStock = false
```

不包含尚未加入My Foods的Reference-only foods。排序使用确定性score：

```text
Recipe Coverage     40%
Regular Buy         25%
Meal Versatility    20%
Favourite           15%
```

常备补货不读取当前plan，也不包含Current Plan Need权重。如果某个食品同时属于当前计划所需，会从当前页面的常备补货候选中排除，避免重复。UI一次显示4项左右，只呈现由regular buy、favourite、meal versatility与recipe coverage形成的自然说明，不显示分数。

候选池先按上述score稳定排序并截取高分的最多12项，再以每批4项确定性切换。`Show another set / 换一批`只切换当前页面的ephemeral页码，不随机重排、不持久化；不足一批时不显示。

## 发现新食材 / Discover New Foods

候选严格来自：

```text
Reference Food Library MINUS My Foods
```

推荐根据Recipe / slot compatibility、当前My Foods类别稀缺度、meal versatility、已有结构化category/tags提供的nutrition utility，以及与现有食品的相似度进行确定性排序。页面从高分候选池每批显示约4项，可以使用与常备补货一致的ephemeral换一批交互，不替代完整Reference Food搜索。

Try Something New只负责推荐，不扩大Meal Generator候选池。用户必须明确点击`Add to My Foods`，系统创建独立User Food copy后，该食品才进入planning pool。默认`inStock = false`；只有用户选择`Add & Mark In Stock`时才设置为true。

任何上述操作都不得修改Reference Food基础数据。

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

My Foods / User Food Library；库存通过每条User Food的In Stock状态表达，不创建第三套食品库。

### 3. Add/Edit Food

Common Food通过Search → Select → Confirm快速加入，也可使用Select multiple批量创建默认非库存的User Food copies；Packaged / Custom Food使用完整营养表单；已有User Food可以继续编辑。

### 4. Recipes

查看和生成Recipe。

### 5. Shopping

缺失食材 + 高频购买建议。

Settings作为右上角入口，不需要单独Bottom Tab。

---

# 36. Settings

包含：

## Language / 语言

* 中文（`zh-CN`，全新安装默认）
* English（`en`）

用户选择后界面立即更新，并在本地持久化；切换语言不得改变Meal Plan、营养结果、库存、Shopping List或Saved Recipe snapshot。

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

## 36.1 Chinese Localization & Mobile Readiness

当前V1提供完整的`zh-CN`与`en`显示层。所有用户可见的页面标题、导航、按钮、表单、状态、错误、空状态、Nutrition Overview、Planning Mode、Recipe与Shopping文案均通过集中translation keys提供，不在页面组件中散落语言判断。

Reference Food与User Food的名称规则保持数据边界：

* 161个Reference Foods使用系统维护的中英文名称映射；底层`id`、营养、来源和匹配字段不变
* 从Reference Food创建且仍保留canonical名称的User Food可通过`referenceFoodId`显示当前语言的系统名称
* reference-linked User Food一旦由用户自定义名称，My Foods、编辑页与Shopping均优先原样显示该User Food名称；canonical Reference Food名称与来源另行展示
* 用户自行创建的Custom Food始终原样显示用户输入名称，不自动翻译
* 找不到安全映射时回退到已有名称

14个Meal Blueprints与13个Cooking Techniques共同提供中英文确定性名称和步骤。Generated Recipe由actual ingredients、selected technique与serving structure组合，不对完整句子做运行时机器翻译，也不引入MealPlan中不存在的食材。

Saved Recipe保存具体`techniqueId` variant。旧Saved Recipe没有`techniqueId`时直接回退原有name/instructions snapshot，不迁移、不覆盖已有保存内容。

移动端继续以约390px宽度为基准，保证主要导航、表单、Meal Card、Shopping actions和语言切换不横向溢出。V1仅补充适合iPhone浏览器与Add to Home Screen的基础meta信息，不增加Service Worker、离线缓存或PWA框架。

---

# 37. 数据持久化

V1：

**localStorage**

当前持久化schema版本：

```text
V6
```

V2增加`referenceFoodId`和`nutritionSource`，并支持将Phase 1已保存的Food数据自动迁移，不清空或覆盖用户已有食品。

Phase 1.2新增的`aliases`和reference source字段为可选元数据，因此当时persist版本保持V2。当前Reference Food Library扩展到161项并新增Browse All，也只影响只读静态目录和UI，不改变User Food schema、不补写已有用户库，因此当前persistence继续保持V6且不需要migration。

Phase 2.1继续复用已持久化的`foods`和`inventoryOnly`。Multi Add仍向同一个User Food数组添加记录；Planning Mode只是`inventoryOnly`的UI映射，因此不改变persist版本，也不需要migration。

Phase 2.2将单个`dailyPlan`与`inventoryOnly`升级为`dailyPlans.free`、`dailyPlans.inventory`和`activePlanningMode`，因此persist版本从V2升级为V3。

Phase 3A新增`savedRecipes` snapshot persistence，因此persist版本从V3升级为V4。

Phase 3B新增`shoppingItems`，因此persist版本从V4升级为V5。Missing Ingredients、Buy Again与Try Something New均即时派生，不持久化为容易过期的重复状态。

Phase 4新增用户语言偏好`locale`，因此persist版本从V5升级为V6。`locale`只影响显示；没有有效语言值的旧状态默认迁移为`zh-CN`。

Blueprint/Technique refinement为`MealPlan`和`SavedRecipe`增加可选`techniqueId`。该字段是向后兼容的嵌套元数据；旧plan可确定性选择默认兼容technique，旧Saved Recipe回退原snapshot，因此persist版本保持V6，不清空、不重建localStorage。

Reference-linked User Food自定义、营养来源切换和同源多variant继续复用现有Food字段；Add & Customize的未保存draft与Shopping歧义提示不持久化。因此本次能力不升级schema，localStorage继续保持V6，既有用户数据无需迁移或重建。

Ingredient Semantics为`Food`增加可选`ingredientKind`。Reference Foods在静态构建时始终解析出明确值；新User Food copy继承该值，Custom Food保存用户选择。旧V6记录通过effective IngredientKind回退即时兼容，因此不升级persist版本、不补写或清空既有localStorage。

V2 → V3 migration：

```text
inventoryOnly = false
→ activePlanningMode = "free"
→ 旧dailyPlan迁移到dailyPlans.free
→ dailyPlans.inventory = null

inventoryOnly = true
→ activePlanningMode = "inventory"
→ 旧dailyPlan迁移到dailyPlans.inventory
→ dailyPlans.free = null
```

迁移必须保留旧DailyPlan，不清空或覆盖用户已有Food、Profile与其他持久化数据。

V4 → V5 migration为旧状态补充空的`shoppingItems`，并完整保留：

* Profile
* My Foods / User Foods
* `dailyPlans.free`
* `dailyPlans.inventory`
* `activePlanningMode`
* `savedRecipes`
* recent generator history

V5 → V6 migration：

```text
locale = valid persisted locale ?? "zh-CN"
```

迁移完整保留Profile、User Foods、两个DailyPlan、active mode、Saved Recipes、Shopping Items与recent history。语言切换不改写这些业务数据，Reference Foods与translation maps仍是只读静态数据，不写入localStorage。

保存：

* Profile
* Foods
* Inventory
* Recipes
* Shopping Items
* 两个mode-specific Today Plans
* Active Planning Mode
* Settings

暂时不需要：

* Account
* Authentication
* Database
* Cloud Sync

## 当前阶段状态

Phase 4 Chinese Localization & Mobile Readiness及Ingredient Semantics V1已完成。当前产品支持中文与英文即时切换、161个Reference Food中文显示与明确IngredientKind、14个Meal Blueprints + 13个Cooking Techniques的deterministic recipe variants、Saved Recipe variant snapshot，以及约390px移动端与基础Add to Home Screen meta适配。Reference Food Library现支持完整分类浏览、全量搜索和跨分类批量建立My Foods；Meal Generator只读取User Foods，并使用结构化culinary identity与派生roles判断组合。所有能力仍只使用本地结构化数据与localStorage，不引入新的服务端能力。

Natural Language Planning明确为`Deferred / Not included in current V1`，不属于当前Localization阶段。尚未实现的能力包括：

* Natural Language
* Constraint Chips
* AI / LLM
* OCR / barcode
* Backend / authentication / cloud

这些能力仍保留在后续阶段范围内，本次文档同步不改变Phase 2–4的既定产品边界。

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

# 39. Future Natural Language实现方向（Deferred）

Natural Language Planning不属于当前V1。未来若重新进入开发范围，建议第一版：

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

等整个Planner逻辑稳定，并在后续阶段获得明确授权后，再决定是否加入LLM。

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

* Shopping List
* High-frequency ingredient recommendations
* Favourite foods
* Store标签
* Composite foods

---

## Deferred — Not included in current V1

* Natural language condition parser
* Constraint Chips
* Natural-language conditional generation

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
