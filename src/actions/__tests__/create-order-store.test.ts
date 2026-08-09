import { describe, it, expect, vi, beforeEach } from "vitest";

// createOrder must resolve the store from its route context (the storeSlug
// carried on the checkout payload, combined with the request host) — never
// fall back to "the oldest store" — and every store-scoped lookup + the
// final order.create stamping must use that resolved store's id.
const {
  resolveStorefrontContext,
  headersGet,
  bookFindMany,
  collectionFindMany,
  orderCreate,
  sendOrderNotification,
} = vi.hoisted(() => ({
  resolveStorefrontContext: vi.fn(),
  headersGet: vi.fn(),
  bookFindMany: vi.fn(),
  collectionFindMany: vi.fn(),
  orderCreate: vi.fn(),
  sendOrderNotification: vi.fn(),
}));

vi.mock("@/lib/storefront-context", () => ({ resolveStorefrontContext }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: headersGet }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: { findMany: bookFindMany },
    collection: { findMany: collectionFindMany },
    order: { create: orderCreate },
  },
}));
vi.mock("@/lib/resend", () => ({ sendOrderNotification }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createOrder } from "@/actions/orders";

const baseInput = {
  storeSlug: "store-b",
  customerName: "زبون تجريبي",
  phone: "0599123456",
  city: "رام الله",
  items: [{ bookId: "book-1", quantity: 1 }],
  collections: [],
};

beforeEach(() => {
  resolveStorefrontContext.mockReset();
  headersGet.mockReset();
  bookFindMany.mockReset();
  collectionFindMany.mockReset();
  orderCreate.mockReset();
  sendOrderNotification.mockReset();

  headersGet.mockReturnValue("store-b.example.com");
  collectionFindMany.mockResolvedValue([]);
  sendOrderNotification.mockResolvedValue(undefined);
});

describe("createOrder store resolution", () => {
  it("resolves the store from route context (slug + host) and scopes lookups + stamping to it", async () => {
    resolveStorefrontContext.mockResolvedValue({
      store: { id: "B" },
      basePath: "/store-b",
    });
    bookFindMany.mockResolvedValue([{ id: "book-1", title: "كتاب", priceMinor: 50 }]);
    orderCreate.mockResolvedValue({ id: "order-1" });

    const result = await createOrder(baseInput);

    expect(resolveStorefrontContext).toHaveBeenCalledWith({
      slugParam: "store-b",
      host: "store-b.example.com",
    });
    expect(bookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ storeId: "B" }) })
    );
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ storeId: "B" }) })
    );
    expect(result).toEqual({ ok: true, orderId: "order-1" });
  });

  it("returns ok:false without touching the database when the store can't be resolved", async () => {
    resolveStorefrontContext.mockResolvedValue(null);

    const result = await createOrder(baseInput);

    expect(result).toEqual({ ok: false, error: "المتجر غير متوفر" });
    expect(bookFindMany).not.toHaveBeenCalled();
    expect(orderCreate).not.toHaveBeenCalled();
  });
});
