import { useState, type FormEvent } from "react";
import { useAppStore } from "../stores/useAppStore";
import type { Equipment, UserProfile } from "../types";
import { EQUIPMENT } from "../utils/foodOptions";

interface SettingsPageProps {
  onDone: () => void;
}

const toggleEquipment = (items: Equipment[], item: Equipment): Equipment[] =>
  items.includes(item) ? items.filter((value) => value !== item) : [...items, item];

export function SettingsPage({ onDone }: SettingsPageProps) {
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [draft, setDraft] = useState<UserProfile>(() => structuredClone(profile));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: string[] = [];
    const positiveFields = [draft.heightCm, draft.weightKg, draft.goalWeightKg, draft.calorieTarget.min, draft.calorieTarget.max, draft.proteinTarget.min, draft.proteinTarget.max, draft.fibreTarget, draft.fruitVegTargetPortions, draft.defaultMaxCookingTime];
    if (positiveFields.some((value) => !Number.isFinite(value) || value <= 0)) nextErrors.push("All profile and target values must be greater than zero.");
    if (draft.calorieTarget.min > draft.calorieTarget.max) nextErrors.push("Minimum calorie target cannot exceed the maximum.");
    if (draft.proteinTarget.min > draft.proteinTarget.max) nextErrors.push("Minimum protein target cannot exceed the maximum.");
    if (draft.equipment.length === 0) nextErrors.push("Choose at least one available piece of equipment.");
    if (nextErrors.length) { setErrors(nextErrors); setSaved(false); return; }
    updateProfile(draft);
    setErrors([]);
    setSaved(true);
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="settings-intro"><p>These are personal planning targets, not universal recommendations. They remain editable and are never hard-coded into calculations.</p></section>
      <section className="form-card">
        <div className="form-section-heading"><span>01</span><div><h2>My profile</h2><p>Useful context for future meal planning.</p></div></div>
        <div className="field-grid field-grid--three">
          <label className="field"><span>Height</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.heightCm} onChange={(event) => setDraft({ ...draft, heightCm: Number(event.target.value) })} /><span>cm</span></div></label>
          <label className="field"><span>Weight</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.weightKg} onChange={(event) => setDraft({ ...draft, weightKg: Number(event.target.value) })} /><span>kg</span></div></label>
          <label className="field"><span>Goal weight</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.goalWeightKg} onChange={(event) => setDraft({ ...draft, goalWeightKg: Number(event.target.value) })} /><span>kg</span></div></label>
          <label className="field"><span>Goal</span><select value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value as UserProfile["goal"] })}><option value="fat_loss">Fat loss</option><option value="maintenance">Maintenance</option><option value="muscle_gain">Muscle gain</option></select></label>
        </div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>02</span><div><h2>Nutrition targets</h2><p>Use gentle ranges that support planning rather than daily scoring.</p></div></div>
        <div className="range-block"><span>Daily calories</span><div className="range-fields"><label className="field"><span>Minimum</span><div className="input-with-unit"><input type="number" min="1" value={draft.calorieTarget.min} onChange={(event) => setDraft({ ...draft, calorieTarget: { ...draft.calorieTarget, min: Number(event.target.value) } })} /><span>kcal</span></div></label><span className="range-divider">to</span><label className="field"><span>Maximum</span><div className="input-with-unit"><input type="number" min="1" value={draft.calorieTarget.max} onChange={(event) => setDraft({ ...draft, calorieTarget: { ...draft.calorieTarget, max: Number(event.target.value) } })} /><span>kcal</span></div></label></div></div>
        <div className="range-block"><span>Daily protein</span><div className="range-fields"><label className="field"><span>Minimum</span><div className="input-with-unit"><input type="number" min="1" value={draft.proteinTarget.min} onChange={(event) => setDraft({ ...draft, proteinTarget: { ...draft.proteinTarget, min: Number(event.target.value) } })} /><span>g</span></div></label><span className="range-divider">to</span><label className="field"><span>Maximum</span><div className="input-with-unit"><input type="number" min="1" value={draft.proteinTarget.max} onChange={(event) => setDraft({ ...draft, proteinTarget: { ...draft.proteinTarget, max: Number(event.target.value) } })} /><span>g</span></div></label></div></div>
        <div className="field-grid"><label className="field"><span>Fibre target</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.fibreTarget} onChange={(event) => setDraft({ ...draft, fibreTarget: Number(event.target.value) })} /><span>g</span></div></label><label className="field"><span>Fruit & veg target</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.fruitVegTargetPortions} onChange={(event) => setDraft({ ...draft, fruitVegTargetPortions: Number(event.target.value) })} /><span>portions</span></div></label></div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>03</span><div><h2>Kitchen & time</h2><p>These constraints shape your generated meals.</p></div></div>
        <fieldset className="choice-group"><legend>Available equipment</legend><div className="check-grid">{EQUIPMENT.map((option) => <label className="check-tile" key={option.value}><input type="checkbox" checked={draft.equipment.includes(option.value)} onChange={() => setDraft({ ...draft, equipment: toggleEquipment(draft.equipment, option.value) })} /><span>{option.label}</span></label>)}</div></fieldset>
        <label className="field"><span>Default maximum cooking time</span><div className="input-with-unit"><input type="number" min="1" value={draft.defaultMaxCookingTime} onChange={(event) => setDraft({ ...draft, defaultMaxCookingTime: Number(event.target.value) })} /><span>minutes</span></div></label>
      </section>

      {errors.length > 0 && <div className="form-errors" role="alert"><strong>Please check the form</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      {saved && <div className="save-message" role="status">Profile saved locally.</div>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onDone}>Back</button><button type="submit" className="primary-button">Save profile</button></div>
    </form>
  );
}
