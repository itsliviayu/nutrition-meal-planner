import { useMemo, useState, type FormEvent } from "react";
import { PortionNutritionPreview } from "../components/PortionNutritionPreview";
import { isServingUnitCompatible } from "../engine/nutritionCalculator";
import { useLocale } from "../i18n/useLocale";
import { useAppStore } from "../stores/useAppStore";
import type { Food, FoodTag, MealType, Nutrition, NutritionBasis, NutritionSource, ServingUnit } from "../types";
import { FOOD_CATEGORIES, FOOD_TAGS, MEAL_TYPES } from "../utils/foodOptions";
import { createId } from "../utils/id";

interface FoodFormPageProps {
  foodId?: string;
  onDone: () => void;
  onCancel?: () => void;
}

const newFood = (): Food => ({
  id: "",
  name: "",
  category: "protein",
  nutritionBasis: "per_100g",
  nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  defaultServing: 100,
  servingUnit: "g",
  inStock: false,
  regularBuy: false,
  favourite: false,
  nutritionSource: "package_label",
  fibreSourceMethod: "AOAC",
  estimatedNutrition: false,
  tags: [],
  compatibleMeals: ["lunch"],
});

const REQUIRED_NUTRIENTS: Array<{ key: keyof Pick<Nutrition, "calories" | "protein" | "carbs" | "fat">; labelKey: "nutrition.calories" | "nutrition.protein" | "nutrition.carbs" | "nutrition.fat"; unit: string }> = [
  { key: "calories", labelKey: "nutrition.calories", unit: "kcal" },
  { key: "protein", labelKey: "nutrition.protein", unit: "g" },
  { key: "carbs", labelKey: "nutrition.carbs", unit: "g" },
  { key: "fat", labelKey: "nutrition.fat", unit: "g" },
];

const OPTIONAL_NUTRIENTS: Array<{ key: keyof Pick<Nutrition, "sugar" | "saturatedFat" | "salt">; labelKey: "form.sugar" | "form.saturatedFat" | "form.salt" }> = [
  { key: "sugar", labelKey: "form.sugar" },
  { key: "saturatedFat", labelKey: "form.saturatedFat" },
  { key: "salt", labelKey: "form.salt" },
];

const toggleArrayValue = <T extends string>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export function FoodFormPage({ foodId, onDone, onCancel = onDone }: FoodFormPageProps) {
  const { categoryName, foodName, mealName, t, tagName } = useLocale();
  const existingFood = useAppStore((state) => state.foods.find((food) => food.id === foodId));
  const addFood = useAppStore((state) => state.addFood);
  const editFood = useAppStore((state) => state.editFood);
  const deleteFood = useAppStore((state) => state.deleteFood);
  const [draft, setDraft] = useState<Food>(() => existingFood ? structuredClone(existingFood) : newFood());
  const [errors, setErrors] = useState<string[]>([]);
  const isEditing = Boolean(existingFood);
  const displayedDraftName = draft.referenceFoodId && draft.name === existingFood?.name
    ? foodName(draft)
    : draft.name;

  const updateNutrition = (key: keyof Nutrition, value: number | undefined) => {
    setDraft((current) => ({ ...current, nutrition: { ...current.nutrition, [key]: value } }));
  };

  const validationErrors = useMemo(() => {
    const nextErrors: string[] = [];
    if (!draft.name.trim()) nextErrors.push(t("form.errorName"));
    if (!Number.isFinite(draft.defaultServing) || draft.defaultServing <= 0) nextErrors.push(t("form.errorServing"));
    for (const { key, labelKey } of REQUIRED_NUTRIENTS) {
      const value = draft.nutrition[key];
      if (!Number.isFinite(value) || value < 0) nextErrors.push(t("form.errorNutrient", { name: t(labelKey) }));
    }
    const fibre = draft.nutrition.fibre;
    if (fibre === undefined) {
      if (draft.nutritionSource !== "reference") nextErrors.push(t("form.errorFibre"));
    } else if (!Number.isFinite(fibre) || fibre < 0) {
      nextErrors.push(t("form.errorFibre"));
    }
    for (const { key, labelKey } of OPTIONAL_NUTRIENTS) {
      const value = draft.nutrition[key];
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) nextErrors.push(t("form.errorNutrient", { name: t(labelKey) }));
    }
    if (!isServingUnitCompatible(draft.nutritionBasis, draft.servingUnit, draft.gramsPerUnit)) {
      nextErrors.push(t("form.errorConversion"));
    }
    if (draft.compatibleMeals.length === 0) nextErrors.push(t("form.errorMeal"));
    return nextErrors;
  }, [draft, t]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const mealTags = draft.compatibleMeals as FoodTag[];
    const normalizedFood: Food = {
      ...draft,
      id: existingFood?.id ?? createId(),
      name: draft.name.trim(),
      brand: draft.brand?.trim() || undefined,
      store: draft.store?.trim() || undefined,
      gramsPerUnit: draft.gramsPerUnit && draft.gramsPerUnit > 0 ? draft.gramsPerUnit : undefined,
      fibreSourceMethod: draft.nutrition.fibre === undefined || draft.nutritionSource === "manual_estimate"
        ? undefined
        : draft.nutritionSource === "package_label"
          ? "AOAC"
          : draft.fibreSourceMethod,
      tags: [...new Set([...draft.tags.filter((tag) => !(["breakfast", "lunch", "snack"] as FoodTag[]).includes(tag)), ...mealTags])],
    };

    if (existingFood) editFood(existingFood.id, normalizedFood);
    else addFood(normalizedFood);
    onDone();
  };

  const handleBasisChange = (basis: NutritionBasis) => {
    const servingUnit: ServingUnit = basis === "per_100ml" ? "ml" : basis === "per_unit" ? "piece" : "g";
    setDraft((current) => ({ ...current, nutritionBasis: basis, servingUnit }));
  };

  const handleSourceChange = (nutritionSource: NutritionSource) => {
    setDraft((current) => ({
      ...current,
      nutritionSource,
      estimatedNutrition: nutritionSource !== "package_label",
      referenceFoodId: nutritionSource === "reference" ? current.referenceFoodId : undefined,
      fibreSourceMethod: nutritionSource === "manual_estimate" || current.nutrition.fibre === undefined
        ? undefined
        : nutritionSource === "package_label"
          ? "AOAC"
          : current.fibreSourceMethod,
    }));
  };

  const handleDelete = () => {
    if (!existingFood || !window.confirm(t("form.deleteConfirm", { name: foodName(existingFood) }))) return;
    deleteFood(existingFood.id);
    onDone();
  };

  if (foodId && !existingFood) {
    return <section className="empty-state"><h2>{t("form.foodNotFound")}</h2><button className="primary-button" type="button" onClick={onDone}>{t("form.backToFoods")}</button></section>;
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="form-card">
        <div className="form-section-heading"><span>01</span><div><h2>{t("form.detailsTitle")}</h2><p>{t("form.detailsBody")}</p></div></div>
        <div className="field-grid">
          <label className="field field--wide"><span>{t("form.name")} *</span><input autoFocus value={displayedDraftName} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t("form.namePlaceholder")} /></label>
          <label className="field"><span>{t("form.category")} *</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Food["category"] })}>{FOOD_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{categoryName(option.value)}</option>)}</select></label>
          <label className="field"><span>{t("form.brand")}</span><input value={draft.brand ?? ""} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} placeholder={t("common.optional")} /></label>
          <label className="field"><span>{t("form.store")}</span><input value={draft.store ?? ""} onChange={(event) => setDraft({ ...draft, store: event.target.value })} placeholder={t("confirm.storePlaceholder")} /></label>
          <label className="field"><span>{t("form.nutritionSource")} *</span><select value={draft.nutritionSource} onChange={(event) => handleSourceChange(event.target.value as NutritionSource)}><option value="package_label">{t("common.packageLabel")}</option><option value="manual_estimate">{t("common.manualEstimate")}</option>{draft.referenceFoodId && <option value="reference">{t("common.referenceNutrition")}</option>}</select></label>
        </div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>02</span><div><h2>{t("form.nutritionTitle")}</h2><p>{t("form.nutritionBody")}</p></div></div>
        <label className="field"><span>{t("form.nutritionBasis")} *</span><select value={draft.nutritionBasis} onChange={(event) => handleBasisChange(event.target.value as NutritionBasis)}><option value="per_100g">{t("form.per100g")}</option><option value="per_100ml">{t("form.per100ml")}</option><option value="per_unit">{t("form.perUnit")}</option></select></label>
        <div className="field-grid field-grid--nutrition">
          {REQUIRED_NUTRIENTS.map(({ key, labelKey, unit }) => (
            <label className="field" key={key}><span>{t(labelKey)} *</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.nutrition[key]} onChange={(event) => updateNutrition(key, Number(event.target.value))} /><span>{unit}</span></div></label>
          ))}
          <label className="field"><span>{t("nutrition.fibre")} {draft.nutritionSource === "reference" ? <em>{t("common.optional")}</em> : "*"}</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.nutrition.fibre ?? ""} onChange={(event) => updateNutrition("fibre", event.target.value === "" ? undefined : Number(event.target.value))} placeholder={t("form.notAvailable")} /><span>g</span></div></label>
          {OPTIONAL_NUTRIENTS.map(({ key, labelKey }) => (
            <label className="field" key={key}><span>{t(labelKey)}</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.nutrition[key] ?? ""} onChange={(event) => updateNutrition(key, event.target.value === "" ? undefined : Number(event.target.value))} placeholder={t("common.optional")} /><span>g</span></div></label>
          ))}
        </div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>03</span><div><h2>{t("form.portionTitle")}</h2><p>{t("form.portionBody")}</p></div></div>
        <div className="field-grid">
          <label className="field"><span>{t("form.defaultServing")} *</span><input type="number" inputMode="decimal" min="0.01" step="any" value={draft.defaultServing} onChange={(event) => setDraft({ ...draft, defaultServing: Number(event.target.value) })} /></label>
          <label className="field"><span>{t("form.servingUnit")} *</span><select value={draft.servingUnit} onChange={(event) => setDraft({ ...draft, servingUnit: event.target.value as ServingUnit })}><option value="g">{t("form.grams")}</option><option value="ml">{t("form.millilitres")}</option><option value="piece">{t("form.piece")}</option></select></label>
          {(draft.servingUnit === "piece" || draft.nutritionBasis === "per_unit") && (
            <label className="field"><span>{t("form.gramsPerUnit")}</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.gramsPerUnit ?? ""} onChange={(event) => setDraft({ ...draft, gramsPerUnit: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder={t("form.conversionPlaceholder")} /><span>g</span></div></label>
          )}
        </div>
        <PortionNutritionPreview food={draft} amount={draft.defaultServing} unit={draft.servingUnit} />
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>04</span><div><h2>{t("form.statusTitle")}</h2><p>{t("form.statusBody")}</p></div></div>
        <div className="check-grid">
          {(["inStock", "regularBuy", "favourite"] as const).map((key) => (
            <label className="check-tile" key={key}><input type="checkbox" checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} /><span>{t(key === "inStock" ? "confirm.inStock" : key === "regularBuy" ? "confirm.regularBuy" : "confirm.favourite")}</span></label>
          ))}
        </div>
        <fieldset className="choice-group"><legend>{t("form.worksFor")}</legend><div className="check-grid">{MEAL_TYPES.map((option) => <label className="check-tile" key={option.value}><input type="checkbox" checked={draft.compatibleMeals.includes(option.value)} onChange={() => setDraft({ ...draft, compatibleMeals: toggleArrayValue<MealType>(draft.compatibleMeals, option.value) })} /><span>{mealName(option.value)}</span></label>)}</div></fieldset>
        <fieldset className="choice-group"><legend>{t("form.helpfulTags")}</legend><div className="tag-checks">{FOOD_TAGS.map((option) => <label key={option.value}><input type="checkbox" checked={draft.tags.includes(option.value)} onChange={() => setDraft({ ...draft, tags: toggleArrayValue<FoodTag>(draft.tags, option.value) })} /><span>{tagName(option.value)}</span></label>)}</div></fieldset>
      </section>

      {errors.length > 0 && <div className="form-errors" role="alert"><strong>{t("form.checkTitle")}</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

      <div className="form-actions">
        {isEditing && <button type="button" className="danger-button" onClick={handleDelete}>{t("form.deleteFood")}</button>}
        <button type="button" className="secondary-button" onClick={onCancel}>{t("action.cancel")}</button>
        <button type="submit" className="primary-button">{t(isEditing ? "form.saveChanges" : "form.addToLibrary")}</button>
      </div>
    </form>
  );
}
