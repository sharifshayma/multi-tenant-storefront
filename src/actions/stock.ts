"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import { getDictionary, t, type Locale } from "@/i18n";
import type { StockMovementType } from "@prisma/client";

export async function createStockMovement(input: {
  bookId: string;
  type: StockMovementType;
  quantity: number; // signed: positive adds stock, negative removes it
  orderId?: string | null;
  note?: string;
}) {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);
  if (!Number.isFinite(input.quantity) || input.quantity === 0) {
    throw new Error(t(d, "errors.stock.invalidQuantity"));
  }
  const book = await prisma.book.findFirst({
    where: { id: input.bookId, storeId: store.id },
    select: { id: true },
  });
  if (!book) throw new Error(t(d, "errors.books.notFound"));
  if (input.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, storeId: store.id },
      select: { id: true },
    });
    if (!order) throw new Error(t(d, "errors.orders.notFound"));
  }
  await prisma.stockMovement.create({
    data: {
      bookId: input.bookId,
      type: input.type,
      quantity: Math.round(input.quantity),
      orderId: input.orderId || null,
      note: input.note || null,
      storeId: store.id,
    },
  });
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
}

export async function deleteStockMovement(id: string) {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);
  const result = await prisma.stockMovement.deleteMany({ where: { id, storeId: store.id } });
  if (result.count === 0) throw new Error(t(d, "errors.stock.movementNotFound"));
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
}
