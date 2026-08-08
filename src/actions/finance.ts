"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import type { TransactionType } from "@prisma/client";

export async function createTransaction(input: {
  type: TransactionType;
  amountNis: number;
  category?: string;
  description?: string;
  orderId?: string | null;
  date: Date;
}) {
  await requireUser();
  if (!Number.isFinite(input.amountNis) || input.amountNis <= 0) {
    throw new Error("المبلغ غير صالح");
  }
  await prisma.transaction.create({
    data: {
      type: input.type,
      amountNis: Math.round(input.amountNis),
      category: input.category || null,
      description: input.description || null,
      orderId: input.orderId || null,
      date: input.date,
    },
  });
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function deleteTransaction(id: string) {
  await requireUser();
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function recordPayment(input: { orderId: string; amountNis: number }) {
  await requireUser();
  if (!Number.isFinite(input.amountNis) || input.amountNis <= 0) {
    throw new Error("المبلغ غير صالح");
  }
  await prisma.transaction.create({
    data: {
      type: "REVENUE",
      amountNis: Math.round(input.amountNis),
      category: "مبيعات",
      orderId: input.orderId,
      date: new Date(),
    },
  });
  revalidatePath("/admin/finance");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin");
}
