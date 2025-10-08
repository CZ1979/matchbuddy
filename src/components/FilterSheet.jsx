import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import BottomSheet from "./layout/BottomSheet";
import { generateAgeGroups } from "../utils/ageGroups";

const radiusOptions = [10, 25, 50];
const defaultFilters = { date: "", ageGroup: "", radius: 25 };

export default function FilterSheet({ open, filters = {}, onClose, onApply, onReset }) {
  const [draft, setDraft] = useState({ ...defaultFilters, ...filters });
  const ageGroups = generateAgeGroups();

  useEffect(() => {
    if (open) {
      setDraft({ ...defaultFilters, ...filters });
    }
  }, [filters, open]);

  const footer = (
    <>
      <button
        type="button"
        className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        onClick={() => {
          onReset?.();
          onClose?.();
        }}
      >
        Zurücksetzen
      </button>
      <button
        type="button"
        className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        onClick={() => {
          onApply?.(draft);
          onClose?.();
        }}
      >
        Anwenden
      </button>
    </>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="Filter" footer={footer}>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-600">
          <span className="mb-1 flex items-center gap-2 text-slate-700">
            <CalendarDays size={16} /> Datum ab
          </span>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={draft.date || ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
          />
        </label>

        <label className="block text-sm font-medium text-slate-600">
          <span className="mb-1 text-slate-700">Altersklasse</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={draft.ageGroup || ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, ageGroup: event.target.value }))}
          >
            <option value="">Alle Altersklassen</option>
            {ageGroups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Umkreis</legend>
          <div className="flex gap-2">
            {radiusOptions.map((radius) => {
              const isActive = Number(draft.radius || 0) === radius;
              return (
                <button
                  key={radius}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, radius }))}
                  className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {radius} km
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={14} />
            Wir zeigen dir Spiele im Umkreis zu deinem Profil-Ort.
          </p>
        </fieldset>
      </div>
    </BottomSheet>
  );
}
