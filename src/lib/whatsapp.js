
export function ensurePlusPrefix(value) {
  if (value === null || value === undefined || value === "") return "";
  // Objekt-Form { countryCode, number }
  if (typeof value === "object") {
    const cc = String(value.countryCode || "+49").replace(/[^\d+]/g, "");
    const num = String(value.number || "").replace(/\D/g, "").replace(/^0+/, "");
    const combined = `${cc}${num}`;
    const normalized = combined.replace(/^\++/, "+");
    return normalized.startsWith("+") ? normalized : `+${normalized.replace(/^\+?/, "")}`;
  }

  // String-Fall (ältere Daten)
  const str = String(value).trim();
  if (str === "") return "";
  if (str.startsWith("00")) return `+${str.slice(2).replace(/\D/g, "")}`;
  if (str.startsWith("+")) return `+${str.slice(1).replace(/\D/g, "")}`;
  
  // Wenn die Nummer mit 0 beginnt, füge deutsche Vorwahl hinzu
  const cleaned = str.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return `+49${cleaned.slice(1)}`;
  }
  
  return `+${cleaned}`;
}


export const normalizePhoneNumber = (value = "") => ensurePlusPrefix(value);

export const buildWhatsAppUrl = ({ phone, message = "" }) => {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return "";
  const base = `https://wa.me/${normalizedPhone}`;
  if (!message) return base;
  // Nutze encodeURI statt encodeURIComponent für konsistentere URL-Kodierung
  return `${base}?text=${message.split('').map(char => {
    // Explizit kodieren: Leerzeichen und Sonderzeichen
    if (char === ' ') return '%20';
    if (char === '!') return '%21';
    return encodeURIComponent(char);
  }).join('')}`;
};

export default {
  normalizePhoneNumber,
  buildWhatsAppUrl,
};
