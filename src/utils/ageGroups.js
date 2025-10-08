// src/utils/ageGroups.js
// Shared helpers for working with MatchBuddy age groups.

/**
 * Normalize an age-group input (e.g. "U12") to a comparable birth-year string.
 * Falls back to the original input if no transformation is possible.
 * @param {string|number|null} value
 * @returns {string}
 */
export function normalizeAgeGroup(value) {
  if (value == null) return "";
  const str = value.toString();
  const match = str.match(/^U(\d{1,2})/i);
  if (match) {
    const age = parseInt(match[1], 10);
    if (!Number.isNaN(age)) {
      const currentYear = new Date().getFullYear();
      return String(currentYear - age);
    }
  }
  return str;
}

/**
 * Build the list of selectable age groups (birth years + adult teams).
 * @returns {{label: string, value: string}[]}
 */
export function generateAgeGroups() {
  const currentYear = new Date().getFullYear();
  const groups = [];
  for (let age = 6; age <= 19; age += 1) {
    const birthYear = currentYear - age;
    groups.push({ label: String(birthYear), value: String(birthYear) });
  }
  groups.push(
    { label: "Herren", value: "Herren" },
    { label: "Damen", value: "Damen" },
    { label: "Soma", value: "Soma" }
  );
  return groups;
}

export default {
  normalizeAgeGroup,
  generateAgeGroups,
};
