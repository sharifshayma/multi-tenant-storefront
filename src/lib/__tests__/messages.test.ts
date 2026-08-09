import { describe, it, expect } from "vitest";
import { getStatusMessage, type MessageOrder } from "../messages";

// totalMinor is stored in integer minor units (4000 = 40.00 in the store's currency).
// The customer-facing message must render this as a formatted amount, not the raw
// minor-unit integer, and must use the store's currency instead of a hard-coded one.

const baseOrder: MessageOrder = {
  id: "abcdefgh12345",
  customerName: "سارة",
  totalMinor: 4000,
  currency: "ILS",
  locale: "ar",
  items: [{ title: "كتاب الأميرة", quantity: 1 }],
  collectionItems: [],
};

describe("getStatusMessage", () => {
  it("renders the formatted total (40.00), not the raw minor-unit integer (4000)", () => {
    const message = getStatusMessage("NEW", baseOrder);
    expect(message).not.toContain("4000");
    expect(message).toMatch(/40(\.00)?/);
  });

  it("does not hard-code a currency word — it uses the store's currency", () => {
    const ils = getStatusMessage("NEW", { ...baseOrder, currency: "ILS", locale: "ar" });
    const usd = getStatusMessage("NEW", { ...baseOrder, currency: "USD", locale: "en" });
    expect(ils).not.toBe(usd);
    expect(usd).toContain("$");
  });

  it("formats totals for different stores/currencies correctly", () => {
    const message = getStatusMessage("CONFIRMED", { ...baseOrder, totalMinor: 4050, currency: "USD", locale: "en" });
    expect(message).toContain("$40.50");
  });
});
