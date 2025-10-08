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
