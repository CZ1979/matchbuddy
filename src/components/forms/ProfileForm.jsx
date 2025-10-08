import { MessageCircle, Phone } from "lucide-react";

const formatPhoneInput = (value) => value.replace(/[^+\d\s]/g, "");

export default function ProfileForm({ values, onChange, onSubmit, isSaving }) {
  const updateField = (field, value) => {
    onChange?.({ ...values, [field]: value });
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
        <div className="flex items-center justify-between text-sm font-medium text-slate-700" id="profile-phone-label">
          <span>Telefonnummer</span>
          <span className="text-xs font-normal text-slate-400">für WhatsApp-Anfragen</span>
        </div>
        <div className="relative">
          <input
            id="profile-phone"
            type="tel"
            required
            autoComplete="tel"
            aria-labelledby="profile-phone-label"
            placeholder="z. B. +49 170 1234567"
            value={values.phone}
            onChange={(event) => updateField("phone", formatPhoneInput(event.target.value))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <Phone size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
        </div>
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          <MessageCircle size={14} /> WhatsApp-Links funktionieren nur mit internationalem Format inkl. +49.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <input
          type="checkbox"
          checked={values.rememberData}
          onChange={(event) => updateField("rememberData", event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
        />
        <span>Daten merken</span>
      </label>

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
