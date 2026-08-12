// prisma/demo-data/generate-orders.ts
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUSES } from "@/lib/order-status";
import { randInt, pick, weightedIndex } from "./prng";
import type { DemoCustomer } from "./customers";

const DAY_MS = 86400000;

export interface GeneratedOrderItem {
  bookSlug: string;
  quantity: number;
  unitPriceMinor: number;
}
export interface GeneratedCollectionItem {
  collectionSlug: string;
  quantity: number;
  unitPriceMinor: number;
  selectedBookSlugs: string[];
}
export interface GeneratedOrder {
  ref: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  notes: string | null;
  status: OrderStatus;
  createdAt: Date;
  discountMinor: number;
  discountReason: string | null;
  totalMinor: number;
  items: GeneratedOrderItem[];
  collectionItems: GeneratedCollectionItem[];
}
export interface GenerateOrdersOpts {
  rng: () => number;
  now: Date;
  windowDays: number;
  count: number;
  bookPrices: Record<string, number>;
  bookSlugs: string[];
  collections: { slug: string; priceMinor: number }[];
  customCollection: { slug: string; priceMinor: number; requiredCount: number };
  customers: DemoCustomer[];
}

const DISCOUNT_REASONS = ["Special offer", "Loyal customer", "Free shipping"];
const NOTES = [null, "Please gift-wrap", "Deliver in the afternoon", "Call before shipping"];

function statusForAge(rng: () => number, ageDays: number, windowDays: number): OrderStatus {
  const frac = ageDays / windowDays;
  if (frac > 0.6) return pick(rng, ["DELIVERED", "DELIVERED", "SHIPPED"] as OrderStatus[]);
  if (frac > 0.35) return pick(rng, ["SHIPPED", "IN_PROGRESS", "DELIVERED"] as OrderStatus[]);
  if (frac > 0.15) return pick(rng, ["IN_PROGRESS", "CONFIRMED"] as OrderStatus[]);
  return pick(rng, ["NEW", "CONFIRMED"] as OrderStatus[]);
}

function distinct<T>(rng: () => number, arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function generateOrders(opts: GenerateOrdersOpts): GeneratedOrder[] {
  const { rng, now, windowDays, count, bookPrices, bookSlugs, collections, customCollection, customers } = opts;
  const orders: GeneratedOrder[] = [];

  for (let n = 0; n < count; n++) {
    // Recent-weighted age: min of two draws skews toward small ageDays.
    const ageDays = Math.min(randInt(rng, 0, windowDays), randInt(rng, 0, windowDays));
    const createdAt = new Date(now.getTime() - ageDays * DAY_MS);

    // First five orders pin one distinct status each for guaranteed coverage.
    const status = n < ORDER_STATUSES.length ? ORDER_STATUSES[n] : statusForAge(rng, ageDays, windowDays);

    const customer = pick(rng, customers);
    const items: GeneratedOrderItem[] = [];
    const collectionItems: GeneratedCollectionItem[] = [];

    const lineCount = randInt(rng, 1, 3);
    for (let l = 0; l < lineCount; l++) {
      const isCollection = weightedIndex(rng, [7, 3]) === 1;
      if (!isCollection) {
        const slug = pick(rng, bookSlugs);
        items.push({ bookSlug: slug, quantity: randInt(rng, 1, 3), unitPriceMinor: bookPrices[slug] });
      } else if (weightedIndex(rng, [85, 15]) === 1) {
        collectionItems.push({
          collectionSlug: customCollection.slug,
          quantity: 1,
          unitPriceMinor: customCollection.priceMinor,
          selectedBookSlugs: distinct(rng, bookSlugs, customCollection.requiredCount),
        });
      } else {
        const c = pick(rng, collections);
        collectionItems.push({
          collectionSlug: c.slug,
          quantity: randInt(rng, 1, 2),
          unitPriceMinor: c.priceMinor,
          selectedBookSlugs: [],
        });
      }
    }

    const gross =
      items.reduce((s, i) => s + i.quantity * i.unitPriceMinor, 0) +
      collectionItems.reduce((s, c) => s + c.quantity * c.unitPriceMinor, 0);

    const hasDiscount = weightedIndex(rng, [80, 20]) === 1 && gross > 2000;
    const discountMinor = hasDiscount ? Math.min(randInt(rng, 500, 2000), gross) : 0;
    const discountReason = hasDiscount ? pick(rng, DISCOUNT_REASONS) : null;

    orders.push({
      ref: `order-${String(n + 1).padStart(3, "0")}`,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      notes: pick(rng, NOTES),
      status,
      createdAt,
      discountMinor,
      discountReason,
      totalMinor: gross - discountMinor,
      items,
      collectionItems,
    });
  }

  return orders;
}
