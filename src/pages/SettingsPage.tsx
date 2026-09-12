import { useState, type FormEvent } from "react";
import { useAppStore } from "../stores/useAppStore";
import { useLocale } from "../i18n/useLocale";
import type { Equipment, UserProfile } from "../types";
import { EQUIPMENT } from "../utils/foodOptions";

interface SettingsPageProps {
  onDone: () => void;
}

const toggleEquipment = (items: Equipment[], item: Equipment): Equipment[] =>
  items.includes(item) ? items.filter((value) => value !== item) : [...items, item];

export function SettingsPage({ onDone }: SettingsPageProps) {
  const { locale, equipmentName, t } = useLocale();
  const setLocale = useAppStore((state) => state.setLocale);
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [draft, setDraft] = useState<UserProfile>(() => structuredClone(profile));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: string[] = [];
    const positiveFields = [draft.heightCm, draft.weightKg, draft.goalWeightKg, draft.calorieTarget.min, draft.calorieTarget.max, draft.proteinTarget.min, draft.proteinTarget.max, draft.fibreTarget, draft.fruitVegTargetPortions, draft.defaultMaxCookingTime];
    if (positiveFields.some((value) => !Number.isFinite(value) || value <= 0)) nextErrors.push(t("settings.errorPositive"));
    if (draft.calorieTarget.min > draft.calorieTarget.max) nextErrors.push(t("settings.errorCalories"));
    if (draft.proteinTarget.min > draft.proteinTarget.max) nextErrors.push(t("settings.errorProtein"));
    if (draft.equipment.length === 0) nextErrors.push(t("settings.errorEquipment"));
    if (nextErrors.length) { setErrors(nextErrors); setSaved(false); return; }
    updateProfile(draft);
    setErrors([]);
    setSaved(true);
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      <section className="form-card">
        <div className="form-section-heading"><span>01</span><div><h2>{t("settings.profileTitle")}</h2><p>{t("settings.profileBody")}</p></div></div>
        <div className="field-grid field-grid--three">
          <label className="field"><span>{t("settings.height")}</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.heightCm} onChange={(event) => setDraft({ ...draft, heightCm: Number(event.target.value) })} /><span>cm</span></div></label>
          <label className="field"><span>{t("settings.weight")}</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.weightKg} onChange={(event) => setDraft({ ...draft, weightKg: Number(event.target.value) })} /><span>kg</span></div></label>
          <label className="field"><span>{t("settings.goalWeight")}</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.goalWeightKg} onChange={(event) => setDraft({ ...draft, goalWeightKg: Number(event.target.value) })} /><span>kg</span></div></label>
          <label className="field"><span>{t("settings.goal")}</span><select value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value as UserProfile["goal"] })}><option value="fat_loss">{t("settings.fatLoss")}</option><option value="maintenance">{t("settings.maintenance")}</option><option value="muscle_gain">{t("settings.muscleGain")}</option></select></label>
        </div>
      </section>

      <section className="form-card settings-targets">
        <div className="form-section-heading"><span>02</span><div><h2>{t("settings.targetsTitle")}</h2><p>{t("settings.targetsBody")}</p></div></div>
        <div className="range-block"><span>{t("settings.dailyCalories")}</span><div className="range-fields"><label className="field"><span>{t("settings.minimum")}</span><div className="input-with-unit"><input type="number" min="1" value={draft.calorieTarget.min} onChange={(event) => setDraft({ ...draft, calorieTarget: { ...draft.calorieTarget, min: Number(event.target.value) } })} /><span>kcal</span></div></label><span className="range-divider">{t("settings.to")}</span><label className="field"><span>{t("settings.maximum")}</span><div className="input-with-unit"><input type="number" min="1" value={draft.calorieTarget.max} onChange={(event) => setDraft({ ...draft, calorieTarget: { ...draft.calorieTarget, max: Number(event.target.value) } })} /><span>kcal</span></div></label></div></div>
        <div className="range-block"><span>{t("settings.dailyProtein")}</span><div className="range-fields"><label className="field"><span>{t("settings.minimum")}</span><div className="input-with-unit"><input type="number" min="1" value={draft.proteinTarget.min} onChange={(event) => setDraft({ ...draft, proteinTarget: { ...draft.proteinTarget, min: Number(event.target.value) } })} /><span>g</span></div></label><span className="range-divider">{t("settings.to")}</span><label className="field"><span>{t("settings.maximum")}</span><div className="input-with-unit"><input type="number" min="1" value={draft.proteinTarget.max} onChange={(event) => setDraft({ ...draft, proteinTarget: { ...draft.proteinTarget, max: Number(event.target.value) } })} /><span>g</span></div></label></div></div>
        <div className="field-grid"><label className="field"><span>{t("settings.fibreTarget")}</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.fibreTarget} onChange={(event) => setDraft({ ...draft, fibreTarget: Number(event.target.value) })} /><span>g</span></div></label><label className="field"><span>{t("settings.fruitVegTarget")}</span><div className="input-with-unit"><input type="number" min="1" step="any" value={draft.fruitVegTargetPortions} onChange={(event) => setDraft({ ...draft, fruitVegTargetPortions: Number(event.target.value) })} /><span>{t("nutrition.portions")}</span></div></label></div>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>03</span><div><h2>{t("settings.planningTitle")}</h2><p>{t("settings.planningBody")}</p></div></div>
        <fieldset className="choice-group"><legend>{t("settings.availableEquipment")}</legend><div className="check-grid">{EQUIPMENT.map((option) => <label className="check-tile" key={option.value}><input type="checkbox" checked={draft.equipment.includes(option.value)} onChange={() => setDraft({ ...draft, equipment: toggleEquipment(draft.equipment, option.value) })} /><span>{equipmentName(option.value)}</span></label>)}</div></fieldset>
        <label className="field"><span>{t("settings.maxTime")}</span><div className="input-with-unit"><input type="number" min="1" value={draft.defaultMaxCookingTime} onChange={(event) => setDraft({ ...draft, defaultMaxCookingTime: Number(event.target.value) })} /><span>{t("settings.minutes")}</span></div></label>
      </section>

      <section className="form-card">
        <div className="form-section-heading"><span>04</span><div><h2>{t("settings.appTitle")}</h2><p>{t("settings.appBody")}</p></div></div>
        <div className="language-selector" role="group" aria-label={t("settings.languageLabel")}>
          <button type="button" className={locale === "zh-CN" ? "is-active" : ""} aria-pressed={locale === "zh-CN"} onClick={() => setLocale("zh-CN")}>{t("settings.chinese")}</button>
          <button type="button" className={locale === "en" ? "is-active" : ""} aria-pressed={locale === "en"} onClick={() => setLocale("en")}>{t("settings.english")}</button>
        </div>
      </section>

      {errors.length > 0 && <div className="form-errors" role="alert"><strong>{t("form.checkTitle")}</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      {saved && <div className="save-message" role="status">{t("settings.saved")}</div>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onDone}>{t("action.back")}</button><button type="submit" className="primary-button">{t("settings.save")}</button></div>
    </form>
  );
}
