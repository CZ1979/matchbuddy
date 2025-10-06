import React from "react";

/**
 * Altersklassen mit korrekter Jahrgangsberechnung:
 * Jahr = aktuelles Jahr − (U − 1)
 * Beispiel (2025): U11 -> 2015, U15 -> 2011
 */
export default function AgeDropdown({ value, onChange, className = "" }) {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let u = 21; u >= 6; u--) {
    const year = currentYear - (u - 1);
    options.push({ label: `U${u} / ${year}`, value: `U${u}/${year}` });
  }

  return (
    <select
  className="select select-bordered w-full"
  value={newGame.ageGroup}
  onChange={(e) => setNewGame((s) => ({ ...s, ageGroup: e.target.value }))}
>
  <option value="">Altersklasse wählen</option>
  {ageGroups.map((a) => (
    <option key={a.value} value={a.value}>
      {a.label}
    </option>
  ))}
</select>

  );
}
