import { useMemo } from "react";
import clsx from "clsx";
import { generateAgeGroups } from "../../utils/ageGroups";

const formatPhoneInput = (value) => value.replace(/[^+\d\s]/g, "");

export default function ProfileForm({ values, onChange, onSubmit, isSaving }) {
  const ageGroupOptions = useMemo(() => generateAgeGroups(), []);
  const selectedAgeGroups = Array.isArray(values.ageGroups) ? values.ageGroups : [];

  const updateField = (field, value) => {
    onChange?.({ ...values, [field]: value });
  };

  const toggleAgeGroup = (ageGroup) => {
    const next = selectedAgeGroups.includes(ageGroup)
      ? selectedAgeGroups.filter((value) => value !== ageGroup)
      : [...selectedAgeGroups, ageGroup];
    updateField("ageGroups", next);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="profile-name">
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          required
          autoComplete="name"
          placeholder="Max Mustermann"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="profile-club">
          Verein
        </label>
        <input
          id="profile-club"
          type="text"
          required
          autoComplete="organization"
          placeholder="TSV Beispielstadt"
          value={values.club}
          onChange={(event) => updateField("club", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="profile-city">
          Ort
        </label>
        <input
          id="profile-city"
          type="text"
          required
          placeholder="z. B. Berlin"
          value={values.city}
          onChange={(event) => updateField("city", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="profile-email">
          E-Mail-Adresse
        </label>
        <input
          id="profile-email"
          type="email"
          required
          autoComplete="email"
          placeholder="trainer@verein.de"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="profile-phone">
          Telefon (für WhatsApp)
        </label>
        <input
          id="profile-phone"
          type="tel"
          required
          placeholder="z. B. +49 170 1234567"
          value={values.phone}
          onChange={(event) => updateField("phone", formatPhoneInput(event.target.value))}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <p className="text-xs text-slate-500">Wir nutzen die Nummer für die WhatsApp-Kontaktaufnahme.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="block text-sm font-medium text-slate-700">Bevorzugte Jahrgänge</legend>
        <p className="text-xs text-slate-500">
          Wähle alle Jahrgänge aus, für die du Spiele suchst. Diese Auswahl bestimmt deine Empfehlungen.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ageGroupOptions.map((group) => {
            const checked = selectedAgeGroups.includes(group.value);
            return (
              <label
                key={group.value}
                className={clsx(
                  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
                  checked
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                  checked={checked}
                  onChange={() => toggleAgeGroup(group.value)}
                />
                <span>{group.label}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">Mindestens ein Jahrgang ist erforderlich.</p>
      </fieldset>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Speichern…" : "Profil speichern & loslegen"}
      </button>
    </form>
  );
}
