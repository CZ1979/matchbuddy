import { describe, expect, it } from "vitest";
import { buildSecureContactUrl } from "../lib/contact";

describe("Secure Contact URL Builder", () => {
  it("builds contact URL with trainer ID only", () => {
    const url = buildSecureContactUrl("trainer123");
    expect(url).toBe("/contact/trainer123");
  });

  it("builds contact URL with message", () => {
    const url = buildSecureContactUrl("trainer123", "Hello Coach!");
    expect(url).toBe("/contact/trainer123?text=Hello%20Coach!");
  });

  it("handles empty message", () => {
    const url = buildSecureContactUrl("trainer123", "");
    expect(url).toBe("/contact/trainer123");
  });

  it("handles missing trainer ID", () => {
    const url = buildSecureContactUrl("");
    expect(url).toBe("");
  });

  it("encodes special characters in message", () => {
    const url = buildSecureContactUrl("trainer123", "Hello & Goodbye!");
    expect(url).toBe("/contact/trainer123?text=Hello%20%26%20Goodbye!");
  });

  it("handles multiline messages", () => {
    const message = "Line 1\nLine 2\nLine 3";
    const url = buildSecureContactUrl("trainer123", message);
    expect(url).toContain("text=");
    expect(decodeURIComponent(url.split("text=")[1])).toBe(message);
  });
});
