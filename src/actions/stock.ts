"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import type { StockMovementType } from "@prisma/client";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

export async function createStockMovement(input: {
  bookId: string;
  type: StockMovementType;
  quantity: number; // signed: positive adds stock, negative removes it
  orderId?: string | null;
  note?: string;
}) {
  await requireAdmin();
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
  await requireAdmin();
  await prisma.stockMovement.delete({ where: { id } });
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
}
