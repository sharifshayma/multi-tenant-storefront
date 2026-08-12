import { describe, it, expect } from "vitest";
import { DEMO_CUSTOMERS } from "@/../prisma/demo-data/customers";
import { DEMO_BOOK_PRICE_MINOR } from "@/../prisma/demo-data/constants";
import { books } from "@/../prisma/demo-data/catalog";

describe("demo customers", () => {
  it("provides 20 unique-named customers with required fields", () => {
    expect(DEMO_CUSTOMERS).toHaveLength(20);
    expect(new Set(DEMO_CUSTOMERS.map((c) => c.name)).size).toBe(20);
    for (const c of DEMO_CUSTOMERS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.phone).toMatch(/^\+?\d[\d\s-]+$/);
      expect(c.city.length).toBeGreaterThan(0);
    }
  });
});

describe("demo book prices", () => {
  it("prices every book in minor units within range", () => {
    for (const b of books) {
      const p = DEMO_BOOK_PRICE_MINOR[b.slug];
      expect(Number.isInteger(p)).toBe(true);
      expect(p).toBeGreaterThanOrEqual(1500);
      expect(p).toBeLessThanOrEqual(2400);
    }
  });
});
