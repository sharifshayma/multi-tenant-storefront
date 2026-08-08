import { describe, it, expect, vi, beforeEach } from "vitest";

// Every action under test resolves the current store via requireStore().
// We mock it to always return store "A" so we can assert that every
// prisma call the action makes is scoped to storeId: "A".
const {
  requireStore,
  stockCreate,
  bookFindFirst,
  bookAggregate,
  orderFindFirst,
  orderUpdateMany,
  transactionDeleteMany,
  transactionAggregate,
} = vi.hoisted(() => ({
  requireStore: vi.fn(),
  stockCreate: vi.fn(),
  bookFindFirst: vi.fn(),
  bookAggregate: vi.fn().mockResolvedValue({ _max: {} }),
  orderFindFirst: vi.fn(),
  orderUpdateMany: vi.fn(),
  transactionDeleteMany: vi.fn(),
  transactionAggregate: vi.fn().mockResolvedValue({ _sum: { amountNis: 0 } }),
}));

vi.mock("@/lib/store-context", () => ({ requireStore }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stockMovement: { create: stockCreate },
    book: { findFirst: bookFindFirst, aggregate: bookAggregate },
    order: { findFirst: orderFindFirst, updateMany: orderUpdateMany },
    transaction: { deleteMany: transactionDeleteMany, aggregate: transactionAggregate },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createStockMovement } from "@/actions/stock";
import { setOrderDiscount } from "@/actions/orders";
import { deleteTransaction } from "@/actions/finance";
import { getFinanceSummary } from "@/lib/data";

beforeEach(() => {
  requireStore.mockReset();
  requireStore.mockResolvedValue({ id: "A" });
  stockCreate.mockReset();
  bookFindFirst.mockReset();
  orderFindFirst.mockReset();
  orderUpdateMany.mockReset();
  transactionDeleteMany.mockReset();
  transactionAggregate.mockReset();
  transactionAggregate.mockResolvedValue({ _sum: { amountNis: 0 } });
});

describe("stock action tenancy", () => {
  it("stamps storeId on create", async () => {
    bookFindFirst.mockResolvedValue({ id: "b1" });
    stockCreate.mockResolvedValue({ id: "m1" });

    await createStockMovement({ bookId: "b1", type: "ADJUSTMENT", quantity: 1, note: undefined });

    expect(stockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ storeId: "A" }) })
    );
  });

  it("verifies the parent book belongs to the store before creating", async () => {
    // Simulate the book existing, but owned by another store (or not found
    // for this store) — the scoped findFirst returns null.
    bookFindFirst.mockResolvedValue(null);

    await expect(
      createStockMovement({ bookId: "foreign-book", type: "ADJUSTMENT", quantity: 1, note: undefined })
    ).rejects.toThrow();

    expect(bookFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "foreign-book", storeId: "A" }) })
    );
    expect(stockCreate).not.toHaveBeenCalled();
  });
});

describe("orders action tenancy", () => {
  it("reads the order scoped by storeId before applying a discount", async () => {
    orderFindFirst.mockResolvedValue({ totalNis: 100 });
    orderUpdateMany.mockResolvedValue({ count: 1 });

    await setOrderDiscount({ orderId: "o1", discountNis: 10 });

    expect(orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "o1", storeId: "A" }) })
    );
  });

  it("cannot discount another store's order (scoped read returns nothing)", async () => {
    orderFindFirst.mockResolvedValue(null);

    const result = await setOrderDiscount({ orderId: "foreign-order", discountNis: 10 });

    expect(result).toEqual({ ok: false, error: "الطلب غير موجود" });
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });
});

describe("finance action tenancy", () => {
  it("scopes delete to the store so another store's transaction can't be removed", async () => {
    transactionDeleteMany.mockResolvedValue({ count: 1 });

    await deleteTransaction("t1");

    expect(transactionDeleteMany).toHaveBeenCalledWith({
      where: { id: "t1", storeId: "A" },
    });
  });

  it("throws when the transaction does not belong to the current store", async () => {
    transactionDeleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteTransaction("foreign-t")).rejects.toThrow();
  });
});

describe("data.ts admin aggregate tenancy", () => {
  it("scopes the finance summary aggregate by storeId", async () => {
    transactionAggregate
      .mockResolvedValueOnce({ _sum: { amountNis: 500 } }) // REVENUE
      .mockResolvedValueOnce({ _sum: { amountNis: 200 } }); // EXPENSE

    const summary = await getFinanceSummary("A");

    expect(summary).toEqual({ totalRevenue: 500, totalExpense: 200, net: 300 });
    expect(transactionAggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ storeId: "A" }) })
    );
    // Every call this admin aggregate makes must be scoped — not just some of them.
    for (const call of transactionAggregate.mock.calls) {
      expect(call[0].where).toMatchObject({ storeId: "A" });
    }
  });
});
