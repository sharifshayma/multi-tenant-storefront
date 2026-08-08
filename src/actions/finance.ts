"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import type { TransactionType } from "@prisma/client";

export async function createTransaction(input: {
  type: TransactionType;
  amountNis: number;
  category?: string;
  description?: string;
  orderId?: string | null;
  date: Date;
}) {
  const store = await requireStore();
  if (!Number.isFinite(input.amountNis) || input.amountNis <= 0) {
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
      amountNis: Math.round(input.amountNis),
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

export async function recordPayment(input: { orderId: string; amountNis: number }) {
  const store = await requireStore();
  if (!Number.isFinite(input.amountNis) || input.amountNis <= 0) {
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
      amountNis: Math.round(input.amountNis),
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
