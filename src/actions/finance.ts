"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import type { TransactionType } from "@prisma/client";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

export async function createTransaction(input: {
  type: TransactionType;
  amountNis: number;
  category?: string;
  description?: string;
  orderId?: string | null;
  date: Date;
}) {
  await requireAdmin();
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
  await requireAdmin();
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function recordPayment(input: { orderId: string; amountNis: number }) {
  await requireAdmin();
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
