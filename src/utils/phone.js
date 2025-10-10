const DEFAULT_COUNTRY_CODE = "+49";

const TWO_DIGIT_CODES = new Set([
  "20",
  "27",
  "30",
  "31",
  "32",
  "33",
  "34",
  "36",
  "39",
  "40",
  "41",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "81",
  "82",
  "84",
  "86",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "98",
]);

const sanitizeCountryCode = (value, fallback = DEFAULT_COUNTRY_CODE) => {
  const raw = (value || "").toString().trim();
  if (!raw) return fallback;
  if (raw.startsWith("+")) return `+${raw.replace(/[^\d]/g, "")}`;
  if (raw.startsWith("00")) return `+${raw.slice(2).replace(/[^\d]/g, "")}`;
  return `+${raw.replace(/[^\d]/g, "")}`;
};

const sanitizeNumber = (value) => value.replace(/\D/g, "").replace(/^0+/, "");

export const toPhoneObject = (value, fallbackCountryCode = DEFAULT_COUNTRY_CODE) => {
  if (!value) {
    return { countryCode: fallbackCountryCode, number: "" };
  }

  if (typeof value === "object") {
    return {
      countryCode: sanitizeCountryCode(value.countryCode, fallbackCountryCode),
      number: sanitizeNumber(String(value.number || "")),
    };
  }

  const raw = String(value).trim();
  if (!raw) {
    return { countryCode: fallbackCountryCode, number: "" };
  }

  const normalized = raw.startsWith("00") ? `+${raw.slice(2)}` : raw;
  if (!normalized.startsWith("+")) {
    return {
      countryCode: fallbackCountryCode,
      number: sanitizeNumber(normalized),
    };
  }

  const digitsOnly = normalized
    .slice(1)
    .replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return { countryCode: fallbackCountryCode, number: "" };
  }

  const candidates = [];
  for (let len = 1; len <= 3 && len < digitsOnly.length; len += 1) {
    const code = `+${digitsOnly.slice(0, len)}`;
    const rest = digitsOnly.slice(len);
    if (rest) {
      candidates.push({ code, rest });
    }
  }

  if (candidates.length === 0) {
    return {
      countryCode: `+${digitsOnly}`,
      number: "",
    };
  }

  const normalizedFallback = sanitizeCountryCode(fallbackCountryCode, DEFAULT_COUNTRY_CODE);
  const fallbackMatch = candidates.find((candidate) => candidate.code === normalizedFallback);
  if (fallbackMatch) {
    return { countryCode: fallbackMatch.code, number: fallbackMatch.rest };
  }

  if (digitsOnly.startsWith("1")) {
    const northAmerica = candidates.find((candidate) => candidate.code === "+1");
    if (northAmerica) {
      return { countryCode: northAmerica.code, number: northAmerica.rest };
    }
  }

  const longest = candidates[candidates.length - 1];
  if (longest && longest.code.length === 4) {
    const ccDigits = longest.code.slice(1);
    const firstTwo = ccDigits.slice(0, 2);
    if (TWO_DIGIT_CODES.has(firstTwo)) {
      return {
        countryCode: `+${firstTwo}`,
        number: `${ccDigits.slice(2)}${longest.rest}`,
      };
    }
  }

  return longest || candidates[0];
};

export default { toPhoneObject };
