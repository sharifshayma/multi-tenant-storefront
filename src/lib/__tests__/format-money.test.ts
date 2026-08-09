import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/format-money";

describe("formatMoney", () => {
  it("formats ILS in Arabic", () => {
    expect(formatMoney(4000, "ILS", "ar")).toContain("40");
  });
  it("formats USD in English with 2 decimals", () => {
    expect(formatMoney(4050, "USD", "en")).toBe("$40.50");
  });
  it("treats the input as minor units (divides by 100)", () => {
    expect(formatMoney(100, "USD", "en")).toBe("$1.00");
  });
});
