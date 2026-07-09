"use server";

import { prisma } from "@/lib/prisma";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { sendOrderNotification } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import type { OrderStatus } from "@prisma/client";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrder(
  input: CheckoutInput
): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const bookIds = data.items.map((i) => i.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, priceNis: true },
  });
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const orderItems: {
    bookId: string;
    quantity: number;
    unitPriceNis: number;
    title: string;
  }[] = [];

  for (const item of data.items) {
    const book = bookMap.get(item.bookId);
    if (!book) {
      return { ok: false, error: "أحد الكتب في السلة لم يعد متوفراً" };
    }
    orderItems.push({
      bookId: book.id,
      quantity: item.quantity,
      unitPriceNis: book.priceNis,
      title: book.title,
    });
  }

  const totalNis = orderItems.reduce(
    (sum, i) => sum + i.unitPriceNis * i.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
      city: data.city,
      notes: data.notes || null,
      totalNis,
      items: {
        create: orderItems.map((i) => ({
          bookId: i.bookId,
          quantity: i.quantity,
          unitPriceNis: i.unitPriceNis,
        })),
      },
    },
  });

  try {
    await sendOrderNotification({
      id: order.id,
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      city: order.city,
      notes: order.notes,
      totalNis: order.totalNis,
      items: orderItems.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPriceNis: i.unitPriceNis,
      })),
    });
  } catch (err) {
    console.error("Order notification email failed", err);
  }

  revalidatePath("/admin/orders");

  return { ok: true, orderId: order.id };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
