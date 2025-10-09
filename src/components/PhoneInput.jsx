import { useState, useEffect } from "react";

export default function PhoneInput({ value = { countryCode: "+49", number: "" }, onChange }) {
  const [countryCode, setCountryCode] = useState(value.countryCode || "+49");
  const [number, setNumber] = useState(value.number || "");
  const [error, setError] = useState("");

  useEffect(() => {
    const ccRaw = String(countryCode || "+49").trim().replace(/^00/, "+").replace(/[^\d+]/g, "");
    const normalizedCC = ccRaw.startsWith("+") ? ccRaw : `+${ccRaw.replace(/^\+?/, "")}`;
    const numeric = String(number || "").replace(/\D/g, "").replace(/^0+/, "");
    onChange?.({ countryCode: normalizedCC, number: numeric });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, number]);

  const handleCountryChange = (e) => {
    let v = e.target.value.trim().replace(/\s+/g, "");
    if (v.startsWith("00")) v = `+${v.slice(2)}`;
    v = v.replace(/^\++/, "+");
    setCountryCode(v || "+49");
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    const noLeadingZero = digits.replace(/^0+/, "");
    setNumber(noLeadingZero);
    setError(digits !== noLeadingZero ? "Ohne führende Null eingeben." : "");
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        Telefonnummer (für WhatsApp)
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            inputMode="tel"
            value={countryCode}
            onChange={handleCountryChange}
            className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            aria-label="Länderkennung"
            placeholder="+49"
          />
          <input
            type="tel"
            inputMode="tel"
            value={number}
            onChange={handleNumberChange}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="z. B. 1712345678 (ohne führende 0)"
            aria-label="Rufnummer"
          />
        </div>
      </label>
      <p className="text-xs text-slate-500">Ohne führende Null eingeben.</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}