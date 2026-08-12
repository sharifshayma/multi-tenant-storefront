import { describe, it, expect } from "vitest";
import { books, collections, customCollection } from "@/../prisma/demo-data/catalog";

describe("demo catalog data", () => {
  it("has 14 books with unique slugs and bilingual titles", () => {
    expect(books).toHaveLength(14);
    const slugs = books.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(14);
    for (const b of books) {
      expect(b.title).toContain("|"); // "arabic | English"
      expect(b.description.length).toBeGreaterThan(0);
    }
  });

  it("every collection references only real book slugs", () => {
    const slugs = new Set(books.map((b) => b.slug));
    for (const c of collections) {
      expect(c.bookSlugs.length).toBeGreaterThan(0);
      for (const s of c.bookSlugs) expect(slugs.has(s)).toBe(true);
      expect(c.priceMinor).toBeGreaterThan(0);
    }
  });

  it("exposes a custom build-your-own collection requiring 5 books", () => {
    expect(customCollection.slug).toBe("build-your-own");
    expect(customCollection.requiredCount).toBe(5);
  });
});
