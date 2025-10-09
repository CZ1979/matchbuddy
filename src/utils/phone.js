export function formatForWhatsapp(phone) {
  if (!phone) return "";
  if (typeof phone === "string") {
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned.replace(/\D/g, "");
    if (cleaned.startsWith("00")) return cleaned.replace(/^00/, "");
    return cleaned.replace(/\D/g, "");
  }
  const cc = String(phone.countryCode || "+49").replace(/[^\d]/g, "");
  const num = String(phone.number || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!num) return "";
  return `${cc}${num}`;
}

export function buildWhatsappUrl(phone) {
  const digits = formatForWhatsapp(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}