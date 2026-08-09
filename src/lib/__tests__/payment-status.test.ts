import { describe, it, expect } from "vitest";
import { getAmountPayable, getPaymentStatus } from "../payment-status";

// Money is stored as integer minor units (×100 of the display currency),
// e.g. totalMinor 4000 = 40.00 in the store's currency.

describe("getAmountPayable", () => {
  it("is total minus discount, in minor units", () => {
    expect(getAmountPayable(4000, 0)).toBe(4000);
    expect(getAmountPayable(4000, 1000)).toBe(3000);
  });

  it("never goes below zero even if discount exceeds total", () => {
    expect(getAmountPayable(4000, 5000)).toBe(0);
  });
});

describe("getPaymentStatus", () => {
  it("is UNPAID when nothing has been paid", () => {
    expect(getPaymentStatus(0, 4000, 0)).toBe("UNPAID");
  });

  it("is PARTIAL when paid is less than payable (e.g. total 4000, paid 1500 -> outstanding 2500)", () => {
    const status = getPaymentStatus(1500, 4000, 0);
    expect(getAmountPayable(4000, 0) - 1500).toBe(2500);
    expect(status).toBe("PARTIAL");
  });

  it("is PAID when paid equals the payable amount", () => {
    expect(getPaymentStatus(4000, 4000, 0)).toBe("PAID");
  });

  it("is OVERPAID when paid exceeds the payable amount", () => {
    expect(getPaymentStatus(4500, 4000, 0)).toBe("OVERPAID");
  });

  it("is GIFT when a discount fully covers the order and nothing was paid", () => {
    expect(getPaymentStatus(0, 4000, 4000)).toBe("GIFT");
  });

  it("is PAID (not GIFT) when order total is zero and there is no discount", () => {
    expect(getPaymentStatus(0, 0, 0)).toBe("PAID");
  });

  it("accounts for discount when computing PARTIAL/PAID (total 4000, discount 1000, paid 3000 -> PAID)", () => {
    expect(getPaymentStatus(3000, 4000, 1000)).toBe("PAID");
  });
});
