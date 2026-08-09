"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import type { TransactionType } from "@prisma/client";

export async function createTransaction(input: {
  type: TransactionType;
  amountMinor: number;
  category?: string;
  description?: string;
  orderId?: string | null;
  date: Date;
}) {
  const store = await requireStore();
  if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) {
    throw new Error("المبلغ غير صالح");
  }
  if (input.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, storeId: store.id },
      select: { id: true },
    });
    if (!order) throw new Error("الطلب غير موجود");
  }
  await prisma.transaction.create({
    data: {
      type: input.type,
      amountMinor: Math.round(input.amountMinor),
      category: input.category || null,
      description: input.description || null,
      orderId: input.orderId || null,
      date: input.date,
      storeId: store.id,
    },
  });
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function deleteTransaction(id: string) {
  const store = await requireStore();
  const result = await prisma.transaction.deleteMany({ where: { id, storeId: store.id } });
  if (result.count === 0) throw new Error("الحركة المالية غير موجودة");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function recordPayment(input: { orderId: string; amountMinor: number }) {
  const store = await requireStore();
  if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) {
    throw new Error("المبلغ غير صالح");
  }
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, storeId: store.id },
    select: { id: true },
  });
  if (!order) throw new Error("الطلب غير موجود");
  await prisma.transaction.create({
    data: {
      type: "REVENUE",
      amountMinor: Math.round(input.amountMinor),
      category: "مبيعات",
      orderId: input.orderId,
      date: new Date(),
      storeId: store.id,
    },
  });
  revalidatePath("/admin/finance");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin");
}
