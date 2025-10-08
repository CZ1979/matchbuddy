import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, normalizePhoneNumber } from "../lib/whatsapp";

describe("WhatsApp helper", () => {
  it("normalizes phone numbers with German prefix", () => {
    expect(normalizePhoneNumber("0176 1234567")).toBe("+491761234567");
    expect(normalizePhoneNumber("0049 30 123456")).toBe("+4930123456");
  });

  it("builds a wa.me URL with encoded message", () => {
    const url = buildWhatsAppUrl({
      phone: "0176 1234567",
      message: "Hallo Trainer!",
    });
    expect(url).toBe("https://wa.me/+491761234567?text=Hallo%20Trainer%21");
  });
});
