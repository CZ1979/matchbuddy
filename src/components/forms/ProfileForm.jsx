import React, { useMemo } from "react";
import clsx from "clsx";
import { generateAgeGroups } from "../../utils/ageGroups";
import PhoneInput from "../PhoneInput";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ProfileForm({ values = {}, onChange, onSubmit, isSaving, showVerificationStatus = false }) {
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

  const handleField = (field) => (e) => onChange({ ...values, [field]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <label className="block text-sm font-medium text-slate-700">
        Name
        <input
          type="text"
          value={values.name || ""}
          onChange={handleField("name")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Verein / Club
        <input
          type="text"
          value={values.club || ""}
          onChange={handleField("club")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Stadt
        <input
          type="text"
          value={values.city || ""}
          onChange={handleField("city")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        <span className="flex items-center justify-between">
          <span>E‑Mail</span>
          <span className="text-xs font-normal text-slate-400">Wird nicht veröffentlicht</span>
        </span>
        <input
          type="email"
          required
          value={values.email || ""}
          onChange={handleField("email")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <div className="space-y-2">
        <PhoneInput
          value={values.phone || { countryCode: "+49", number: "" }}
          onChange={(phone) => onChange({ ...values, phone })}
        />
        {showVerificationStatus && (
          <div className={clsx(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
            values.phoneVerified
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          )}>
            {values.phoneVerified ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Verifiziert</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Nicht verifiziert</span>
              </>
            )}
          </div>
        )}
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

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
        >
          {isSaving ? "Speichern…" : "Profil speichern"}
        </button>
      </div>
    </form>
  );
}
