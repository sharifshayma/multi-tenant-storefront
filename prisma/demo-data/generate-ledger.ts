// prisma/demo-data/generate-ledger.ts
import type { StockMovementType } from "@prisma/client";
import { randInt, pick } from "./prng";
import type { GeneratedOrder } from "./generate-orders";

const DAY_MS = 86400000;

export interface GeneratedTransaction {
  type: "REVENUE" | "EXPENSE";
  amountMinor: number;
  category: string | null;
  description: string | null;
  orderRef: string | null;
  date: Date;
}
export interface GeneratedStockMovement {
  bookSlug: string;
  type: StockMovementType;
  quantity: number;
  orderRef: string | null;
  note: string | null;
  createdAt: Date;
}
export interface GenerateLedgerOpts {
  rng: () => number;
  now: Date;
  windowDays: number;
  orders: GeneratedOrder[];
  bookSlugs: string[];
}

const EXPENSE_CATEGORIES = ["printing", "ads", "shipping", "supplies"];
const EXPENSE_DESC: Record<string, string> = {
  printing: "طباعة دفعة كتب",
  ads: "حملة إعلانية",
  shipping: "رسوم شحن",
  supplies: "مستلزمات تغليف",
};

export function generateLedger(opts: GenerateLedgerOpts): {
  transactions: GeneratedTransaction[];
  stockMovements: GeneratedStockMovement[];
} {
  const { rng, now, windowDays, orders, bookSlugs } = opts;
  const windowStart = new Date(now.getTime() - windowDays * DAY_MS);

  const transactions: GeneratedTransaction[] = [];

  // REVENUE: one per paid (non-NEW) order.
  for (const o of orders) {
    if (o.status === "NEW") continue;
    transactions.push({
      type: "REVENUE",
      amountMinor: o.totalMinor,
      category: "sales",
      description: `مبيعات الطلب ${o.ref}`,
      orderRef: o.ref,
      date: o.createdAt,
    });
  }

  // EXPENSE: 15 rows spread across the window.
  for (let i = 0; i < 15; i++) {
    const category = pick(rng, EXPENSE_CATEGORIES);
    transactions.push({
      type: "EXPENSE",
      amountMinor: randInt(rng, 3000, 25000),
      category,
      description: EXPENSE_DESC[category],
      orderRef: null,
      date: new Date(now.getTime() - randInt(rng, 0, windowDays) * DAY_MS),
    });
  }

  // Stock: tally shipped-out per book from shipped/delivered orders.
  const shippedOut: Record<string, number> = {};
  const shippedMovements: GeneratedStockMovement[] = [];
  for (const o of orders) {
    if (o.status !== "SHIPPED" && o.status !== "DELIVERED") continue;
    for (const it of o.items) {
      shippedOut[it.bookSlug] = (shippedOut[it.bookSlug] ?? 0) + it.quantity;
      shippedMovements.push({
        bookSlug: it.bookSlug,
        type: "SHIPPED",
        quantity: it.quantity,
        orderRef: o.ref,
        note: null,
        createdAt: o.createdAt,
      });
    }
  }

  const stockMovements: GeneratedStockMovement[] = [];
  for (const slug of bookSlugs) {
    const damaged = randInt(rng, 0, 3);
    const adjustment = randInt(rng, 0, 5);
    const out = (shippedOut[slug] ?? 0) + damaged;
    // Ensure PRINTED covers everything shipped/damaged with headroom.
    const printed = Math.max(randInt(rng, 80, 160), out + randInt(rng, 20, 60));

    stockMovements.push({
      bookSlug: slug,
      type: "PRINTED",
      quantity: printed,
      orderRef: null,
      note: "دفعة طباعة أولية",
      createdAt: windowStart,
    });
    if (damaged > 0) {
      stockMovements.push({
        bookSlug: slug,
        type: "DAMAGED",
        quantity: damaged,
        orderRef: null,
        note: "تلف أثناء التخزين",
        createdAt: new Date(now.getTime() - randInt(rng, 1, windowDays) * DAY_MS),
      });
    }
    if (adjustment > 0) {
      stockMovements.push({
        bookSlug: slug,
        type: "ADJUSTMENT",
        quantity: adjustment,
        orderRef: null,
        note: "جرد المخزون",
        createdAt: new Date(now.getTime() - randInt(rng, 1, windowDays) * DAY_MS),
      });
    }
  }
  stockMovements.push(...shippedMovements);

  return { transactions, stockMovements };
}
