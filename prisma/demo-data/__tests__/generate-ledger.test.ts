// prisma/demo-data/__tests__/generate-ledger.test.ts
import { describe, it, expect } from "vitest";
import { mulberry32 } from "@/../prisma/demo-data/prng";
import { generateOrders } from "@/../prisma/demo-data/generate-orders";
import { generateLedger } from "@/../prisma/demo-data/generate-ledger";
import { books, collections, customCollection } from "@/../prisma/demo-data/catalog";
import { DEMO_CUSTOMERS } from "@/../prisma/demo-data/customers";
import { DEMO_BOOK_PRICE_MINOR } from "@/../prisma/demo-data/constants";

const NOW = new Date("2026-08-12T12:00:00.000Z");
const bookSlugs = books.map((b) => b.slug);

function buildOrders() {
  return generateOrders({
    rng: mulberry32(20260812),
    now: NOW,
    windowDays: 90,
    count: 40,
    bookPrices: DEMO_BOOK_PRICE_MINOR,
    bookSlugs,
    collections: collections.map((c) => ({ slug: c.slug, priceMinor: c.priceMinor })),
    customCollection: {
      slug: customCollection.slug,
      priceMinor: customCollection.priceMinor,
      requiredCount: customCollection.requiredCount,
    },
    customers: DEMO_CUSTOMERS,
  });
}

function buildLedger() {
  return generateLedger({ rng: mulberry32(777), now: NOW, windowDays: 90, orders: buildOrders(), bookSlugs });
}

describe("generateLedger", () => {
  it("emits one REVENUE per non-NEW order and 15 EXPENSE rows", () => {
    const orders = buildOrders();
    const { transactions } = buildLedger();
    const revenue = transactions.filter((t) => t.type === "REVENUE");
    const expense = transactions.filter((t) => t.type === "EXPENSE");
    expect(revenue).toHaveLength(orders.filter((o) => o.status !== "NEW").length);
    expect(expense).toHaveLength(15);
    for (const r of revenue) expect(r.orderRef).not.toBeNull();
  });

  it("keeps per-book net stock on-hand >= 0", () => {
    const { stockMovements } = buildLedger();
    const net: Record<string, number> = {};
    for (const m of stockMovements) {
      const sign = m.type === "PRINTED" || m.type === "ADJUSTMENT" ? 1 : -1;
      net[m.bookSlug] = (net[m.bookSlug] ?? 0) + sign * m.quantity;
    }
    for (const slug of bookSlugs) expect(net[slug] ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic", () => {
    expect(JSON.stringify(buildLedger())).toEqual(JSON.stringify(buildLedger()));
  });
});
