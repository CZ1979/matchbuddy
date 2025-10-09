
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
  return `+${str.replace(/\D/g, "")}`;
}


export const normalizePhoneNumber = (value = "") => ensurePlusPrefix(value);

export const buildWhatsAppUrl = ({ phone, message = "" }) => {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return "";
  const base = `https://wa.me/${normalizedPhone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
};

export default {
  normalizePhoneNumber,
  buildWhatsAppUrl,
};
