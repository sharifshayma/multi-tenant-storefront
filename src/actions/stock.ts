"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import type { StockMovementType } from "@prisma/client";

export async function createStockMovement(input: {
  bookId: string;
  type: StockMovementType;
  quantity: number; // signed: positive adds stock, negative removes it
  orderId?: string | null;
  note?: string;
}) {
  await requireUser();
  if (!Number.isFinite(input.quantity) || input.quantity === 0) {
    throw new Error("الكمية غير صالحة");
  }
  await prisma.stockMovement.create({
    data: {
      bookId: input.bookId,
      type: input.type,
      quantity: Math.round(input.quantity),
      orderId: input.orderId || null,
      note: input.note || null,
    },
  });
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
}

export async function deleteStockMovement(id: string) {
  await requireUser();
  await prisma.stockMovement.delete({ where: { id } });
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
}
