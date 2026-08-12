// prisma/demo-data/__tests__/generate-orders.test.ts
import { describe, it, expect } from "vitest";
import { mulberry32 } from "@/../prisma/demo-data/prng";
import { generateOrders } from "@/../prisma/demo-data/generate-orders";
import { books, collections, customCollection } from "@/../prisma/demo-data/catalog";
import { DEMO_CUSTOMERS } from "@/../prisma/demo-data/customers";
import { DEMO_BOOK_PRICE_MINOR } from "@/../prisma/demo-data/constants";

const NOW = new Date("2026-08-12T12:00:00.000Z");

function build() {
  return generateOrders({
    rng: mulberry32(20260812),
    now: NOW,
    windowDays: 90,
    count: 40,
    bookPrices: DEMO_BOOK_PRICE_MINOR,
    bookSlugs: books.map((b) => b.slug),
    collections: collections.map((c) => ({ slug: c.slug, priceMinor: c.priceMinor })),
    customCollection: {
      slug: customCollection.slug,
      priceMinor: customCollection.priceMinor,
      requiredCount: customCollection.requiredCount,
    },
    customers: DEMO_CUSTOMERS,
  });
}

describe("generateOrders", () => {
  it("produces the requested count deterministically", () => {
    const a = build();
    const b = build();
    expect(a).toHaveLength(40);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("covers all five order statuses", () => {
    const statuses = new Set(build().map((o) => o.status));
    for (const s of ["NEW", "CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED"]) {
      expect(statuses.has(s as never)).toBe(true);
    }
  });

  it("keeps totalMinor == items + collections - discount, and >= 0", () => {
    for (const o of build()) {
      const itemsSum = o.items.reduce((s, i) => s + i.quantity * i.unitPriceMinor, 0);
      const collSum = o.collectionItems.reduce((s, c) => s + c.quantity * c.unitPriceMinor, 0);
      expect(o.totalMinor).toBe(itemsSum + collSum - o.discountMinor);
      expect(o.totalMinor).toBeGreaterThanOrEqual(0);
      expect(o.items.length + o.collectionItems.length).toBeGreaterThan(0);
    }
  });

  it("places every createdAt inside the window", () => {
    const min = NOW.getTime() - 90 * 86400000;
    for (const o of build()) {
      expect(o.createdAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
      expect(o.createdAt.getTime()).toBeGreaterThanOrEqual(min);
    }
  });

  it("attaches requiredCount selected books to any custom-collection line", () => {
    for (const o of build()) {
      for (const c of o.collectionItems) {
        if (c.collectionSlug === customCollection.slug) {
          expect(c.selectedBookSlugs).toHaveLength(customCollection.requiredCount);
          expect(new Set(c.selectedBookSlugs).size).toBe(customCollection.requiredCount);
        }
      }
    }
  });
});
