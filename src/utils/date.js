// src/utils/date.js
// Utility helper to format ISO date strings into German locale output.

/**
 * Format a given ISO date string to the German locale (DD.MM.YYYY).
 * Falls back to the original string when parsing fails.
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateGerman(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default formatDateGerman;
