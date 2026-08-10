import { describe, it, expect } from "vitest";
import { t, dirFor, getDictionary } from "@/i18n";

const fixture = {
  common: { save: "SAVE" },
  admin: { orders: { totalCopies: "{n} total" } },
} as unknown as import("@/i18n").Dictionary;

describe("t", () => {
  it("resolves a dot path", () => {
    expect(t(fixture, "common.save")).toBe("SAVE");
  });
  it("interpolates {vars}", () => {
    expect(t(fixture, "admin.orders.totalCopies", { n: 5 })).toBe("5 total");
  });
  it("returns the path on a missing key", () => {
    expect(t(fixture, "nope.missing")).toBe("nope.missing");
  });
});

describe("dirFor / getDictionary", () => {
  it("maps locale to direction", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });
  it("returns a dictionary per locale", () => {
    expect(getDictionary("ar").common.save).toBeTypeOf("string");
    expect(getDictionary("en").common.save).toBeTypeOf("string");
  });
});
