const ensurePlusPrefix = (value = "") => {
  let phone = value.trim();
  if (!phone) return "";
  if (phone.startsWith("0049")) {
    phone = "+" + phone.slice(2);
  } else if (phone.startsWith("00") && !phone.startsWith("0049")) {
    phone = "+" + phone.slice(2);
  } else if (phone.startsWith("0") && !phone.startsWith("+")) {
    phone = "+49" + phone.slice(1);
  } else if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }
  return phone.replace(/\s+/g, "");
};

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
