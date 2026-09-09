import { useMemo, useState, type FormEvent } from "react";
import { PortionNutritionPreview } from "../components/PortionNutritionPreview";
import { isServingUnitCompatible } from "../engine/nutritionCalculator";
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

const REQUIRED_NUTRIENTS: Array<{ key: keyof Pick<Nutrition, "calories" | "protein" | "carbs" | "fat">; label: string; unit: string }> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

const OPTIONAL_NUTRIENTS: Array<{ key: keyof Pick<Nutrition, "sugar" | "saturatedFat" | "salt">; label: string }> = [
  { key: "sugar", label: "Sugar" },
  { key: "saturatedFat", label: "Saturated fat" },
  { key: "salt", label: "Salt" },
];

const toggleArrayValue = <T extends string>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export function FoodFormPage({ foodId, onDone, onCancel = onDone }: FoodFormPageProps) {
  const existingFood = useAppStore((state) => state.foods.find((food) => food.id === foodId));
  const addFood = useAppStore((state) => state.addFood);
  const editFood = useAppStore((state) => state.editFood);
  const deleteFood = useAppStore((state) => state.deleteFood);
  const [draft, setDraft] = useState<Food>(() => existingFood ? structuredClone(existingFood) : newFood());
  const [errors, setErrors] = useState<string[]>([]);
  const isEditing = Boolean(existingFood);

  const updateNutrition = (key: keyof Nutrition, value: number | undefined) => {
    setDraft((current) => ({ ...current, nutrition: { ...current.nutrition, [key]: value } }));
  };

  const validationErrors = useMemo(() => {
    const nextErrors: string[] = [];
    if (!draft.name.trim()) nextErrors.push("Food name is required.");
    if (!Number.isFinite(draft.defaultServing) || draft.defaultServing <= 0) nextErrors.push("Default serving must be greater than zero.");
    for (const { key, label } of REQUIRED_NUTRIENTS) {
      const value = draft.nutrition[key];
      if (!Number.isFinite(value) || value < 0) nextErrors.push(`${label} must be zero or greater.`);
    }
    const fibre = draft.nutrition.fibre;
    if (fibre === undefined) {
      if (draft.nutritionSource !== "reference") nextErrors.push("Fibre must be zero or greater.");
    } else if (!Number.isFinite(fibre) || fibre < 0) {
      nextErrors.push("Fibre must be zero or greater.");
    }
    for (const { key, label } of OPTIONAL_NUTRIENTS) {
      const value = draft.nutrition[key];
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) nextErrors.push(`${label} must be zero or greater.`);
    }
    if (!isServingUnitCompatible(draft.nutritionBasis, draft.servingUnit, draft.gramsPerUnit)) {
      nextErrors.push("This nutrition basis and serving unit need a valid grams-per-unit conversion.");
    }
    if (draft.compatibleMeals.length === 0) nextErrors.push("Choose at least one compatible meal.");
    return nextErrors;
  }, [draft]);

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
    if (!existingFood || !window.confirm(`Delete ${existingFood.name}? This cannot be undone.`)) return;
    deleteFood(existingFood.id);
    onDone();
  };

  if (foodId && !existingFood) {
    return <section className="empty-state"><h2>Food not found</h2><button className="primary-button" type="button" onClick={onDone}>Back to Foods</button></section>;
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="form-card">
        <div className="form-section-heading"><span>01</span><div><h2>Food details</h2><p>The name and grouping used throughout your library.</p></div></div>
        <div className="field-grid">
          <label className="field field--wide"><span>Name *</span><input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Greek yogurt" /></label>
          <label className="field"><span>Category *</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Food["category"] })}>{FOOD_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="field"><span>Brand</span><input value={draft.brand ?? ""} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} placeholder="Optional" /></label>
          <label className="field"><span>Store</span><input value={draft.store ?? ""} onChange={(event) => setDraft({ ...draft, store: event.target.value })} placeholder="e.g. Lidl" /></label>
          <label className="field"><span>Nutrition source *</span><select value={draft.nutritionSource} onChange={(event) => handleSourceChange(event.target.value as NutritionSource)}><option value="package_label">Package label</option><option value="manual_estimate">Manual estimate</option>{draft.referenceFoodId && <option value="reference">Reference nutrition</option>}</select></label>
        </div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>02</span><div><h2>Nutrition label</h2><p>Enter values exactly as shown for the selected basis.</p></div></div>
        <label className="field"><span>Nutrition basis *</span><select value={draft.nutritionBasis} onChange={(event) => handleBasisChange(event.target.value as NutritionBasis)}><option value="per_100g">Per 100g</option><option value="per_100ml">Per 100ml</option><option value="per_unit">Per unit</option></select></label>
        <div className="field-grid field-grid--nutrition">
          {REQUIRED_NUTRIENTS.map(({ key, label, unit }) => (
            <label className="field" key={key}><span>{label} *</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.nutrition[key]} onChange={(event) => updateNutrition(key, Number(event.target.value))} /><span>{unit}</span></div></label>
          ))}
          <label className="field"><span>Fibre {draft.nutritionSource === "reference" ? <em>Optional</em> : "*"}</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.nutrition.fibre ?? ""} onChange={(event) => updateNutrition("fibre", event.target.value === "" ? undefined : Number(event.target.value))} placeholder="Not available" /><span>g</span></div></label>
          {OPTIONAL_NUTRIENTS.map(({ key, label }) => (
            <label className="field" key={key}><span>{label}</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.nutrition[key] ?? ""} onChange={(event) => updateNutrition(key, event.target.value === "" ? undefined : Number(event.target.value))} placeholder="Optional" /><span>g</span></div></label>
          ))}
        </div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>03</span><div><h2>Usual portion</h2><p>This becomes the starting amount in future meal plans.</p></div></div>
        <div className="field-grid">
          <label className="field"><span>Default serving *</span><input type="number" inputMode="decimal" min="0.01" step="any" value={draft.defaultServing} onChange={(event) => setDraft({ ...draft, defaultServing: Number(event.target.value) })} /></label>
          <label className="field"><span>Serving unit *</span><select value={draft.servingUnit} onChange={(event) => setDraft({ ...draft, servingUnit: event.target.value as ServingUnit })}><option value="g">grams (g)</option><option value="ml">millilitres (ml)</option><option value="piece">piece</option></select></label>
          {(draft.servingUnit === "piece" || draft.nutritionBasis === "per_unit") && (
            <label className="field"><span>Grams per unit</span><div className="input-with-unit"><input type="number" inputMode="decimal" min="0" step="any" value={draft.gramsPerUnit ?? ""} onChange={(event) => setDraft({ ...draft, gramsPerUnit: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder="For conversions" /><span>g</span></div></label>
          )}
        </div>
        <PortionNutritionPreview food={draft} amount={draft.defaultServing} unit={draft.servingUnit} />
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>04</span><div><h2>Library status</h2><p>These preferences will guide later planning phases.</p></div></div>
        <div className="check-grid">
          {(["inStock", "regularBuy", "favourite"] as const).map((key) => (
            <label className="check-tile" key={key}><input type="checkbox" checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} /><span>{key === "inStock" ? "In stock" : key === "regularBuy" ? "Regular buy" : "Favourite"}</span></label>
          ))}
        </div>
        <fieldset className="choice-group"><legend>Works for</legend><div className="check-grid">{MEAL_TYPES.map((option) => <label className="check-tile" key={option.value}><input type="checkbox" checked={draft.compatibleMeals.includes(option.value)} onChange={() => setDraft({ ...draft, compatibleMeals: toggleArrayValue<MealType>(draft.compatibleMeals, option.value) })} /><span>{option.label}</span></label>)}</div></fieldset>
        <fieldset className="choice-group"><legend>Helpful tags</legend><div className="tag-checks">{FOOD_TAGS.map((option) => <label key={option.value}><input type="checkbox" checked={draft.tags.includes(option.value)} onChange={() => setDraft({ ...draft, tags: toggleArrayValue<FoodTag>(draft.tags, option.value) })} /><span>{option.label}</span></label>)}</div></fieldset>
      </section>

      {errors.length > 0 && <div className="form-errors" role="alert"><strong>Please check the form</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

      <div className="form-actions">
        {isEditing && <button type="button" className="danger-button" onClick={handleDelete}>Delete food</button>}
        <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-button">{isEditing ? "Save changes" : "Add to library"}</button>
      </div>
    </form>
  );
}
