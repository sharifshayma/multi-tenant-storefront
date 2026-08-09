import { describe, it, expect } from "vitest";
import { slugify, isReservedSlug, uniqueStoreSlug, validateStoreSlug } from "@/lib/store-slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Shayma's Books")).toBe("shaymas-books");
  });
  it("strips leading/trailing separators", () => {
    expect(slugify("  Hello!!  ")).toBe("hello");
  });
  it("strips curly apostrophes", () => {
    expect(slugify("Jane\u2019s Crafts")).toBe("janes-crafts");
  });
});

describe("isReservedSlug", () => {
  it("flags reserved words", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("janes-crafts")).toBe(false);
  });
});

describe("uniqueStoreSlug", () => {
  it("returns the base slug when free", async () => {
    expect(await uniqueStoreSlug("Jane's Crafts", async () => false)).toBe("janes-crafts");
  });
  it("suffixes on collision", async () => {
    const taken = new Set(["janes-crafts", "janes-crafts-2"]);
    expect(await uniqueStoreSlug("Jane's Crafts", async (s) => taken.has(s))).toBe("janes-crafts-3");
  });
  it("never returns a reserved slug", async () => {
    expect(await uniqueStoreSlug("admin", async () => false)).toBe("admin-2");
  });
});

describe("validateStoreSlug", () => {
  it("normalizes a valid name to a slug", () => {
    expect(validateStoreSlug("Jane's Crafts")).toEqual({ ok: true, slug: "janes-crafts" });
  });
  it("rejects input that is empty after slugify", () => {
    expect(validateStoreSlug("!!!")).toEqual({ ok: false, error: "العنوان غير صالح" });
  });
  it("rejects a reserved slug", () => {
    const r = validateStoreSlug("admin");
    expect(r.ok).toBe(false);
  });
});
