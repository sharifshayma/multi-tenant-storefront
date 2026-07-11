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

  const collectionIds = data.collections.map((c) => c.collectionId);
  const collections = await prisma.collection.findMany({
    where: { id: { in: collectionIds } },
    include: { books: { select: { bookId: true } } },
  });
  const collectionMap = new Map(collections.map((c) => [c.id, c]));

  const allBookIds = new Set<string>();
  for (const c of data.collections) for (const id of c.selectedBookIds) allBookIds.add(id);
  const selectedBookRecords = await prisma.book.findMany({
    where: { id: { in: [...allBookIds] } },
    select: { id: true, title: true },
  });
  const selectedBookMap = new Map(selectedBookRecords.map((b) => [b.id, b]));

  const orderCollectionItems: {
    collectionId: string;
    quantity: number;
    unitPriceNis: number;
    title: string;
    bookIds: string[];
    bookTitles: string[];
  }[] = [];

  for (const item of data.collections) {
    const collection = collectionMap.get(item.collectionId);
    if (!collection) {
      return { ok: false, error: "إحدى المجموعات لم تعد متوفرة" };
    }

    let bookIds: string[];
    if (collection.isCustom) {
      const requiredCount = collection.requiredCount ?? item.selectedBookIds.length;
      const uniqueIds = [...new Set(item.selectedBookIds)];
      if (uniqueIds.length !== requiredCount) {
        return {
          ok: false,
          error: `الرجاء اختيار ${requiredCount} كتب مختلفة لمجموعة "${collection.title}"`,
        };
      }
      if (!uniqueIds.every((id) => selectedBookMap.has(id))) {
        return { ok: false, error: "أحد الكتب المختارة لم يعد متوفراً" };
      }
      bookIds = uniqueIds;
    } else {
      // Fixed collections: always use the admin-defined set, never trust client selection
      bookIds = collection.books.map((b) => b.bookId);
    }

    orderCollectionItems.push({
      collectionId: collection.id,
      quantity: item.quantity,
      unitPriceNis: collection.priceNis,
      title: collection.title,
      bookIds,
      bookTitles: bookIds.map((id) => selectedBookMap.get(id)?.title ?? bookMap.get(id)?.title ?? ""),
    });
  }

  const totalNis =
    orderItems.reduce((sum, i) => sum + i.unitPriceNis * i.quantity, 0) +
    orderCollectionItems.reduce((sum, i) => sum + i.unitPriceNis * i.quantity, 0);

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
      collectionItems: {
        create: orderCollectionItems.map((i) => ({
          collectionId: i.collectionId,
          quantity: i.quantity,
          unitPriceNis: i.unitPriceNis,
          selectedBooks: {
            create: i.bookIds.map((bookId) => ({ bookId })),
          },
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
      collectionItems: orderCollectionItems.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPriceNis: i.unitPriceNis,
        bookTitles: i.bookTitles,
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

  if (status === "SHIPPED") {
    // Idempotency: only decrement stock once per order, even if the status
    // is later toggled away from and back to SHIPPED.
    const alreadyShipped = await prisma.stockMovement.findFirst({
      where: { orderId, type: "SHIPPED" },
    });
    if (!alreadyShipped) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          items: { select: { bookId: true, quantity: true } },
          collectionItems: {
            select: {
              quantity: true,
              selectedBooks: { select: { bookId: true } },
            },
          },
        },
      });
      if (order) {
        const bookQuantities = new Map<string, number>();
        for (const item of order.items) {
          bookQuantities.set(item.bookId, (bookQuantities.get(item.bookId) ?? 0) + item.quantity);
        }
        for (const ci of order.collectionItems) {
          for (const sb of ci.selectedBooks) {
            bookQuantities.set(sb.bookId, (bookQuantities.get(sb.bookId) ?? 0) + ci.quantity);
          }
        }
        if (bookQuantities.size > 0) {
          await prisma.stockMovement.createMany({
            data: [...bookQuantities.entries()].map(([bookId, quantity]) => ({
              bookId,
              type: "SHIPPED" as const,
              quantity: -quantity,
              orderId,
              note: "خصم تلقائي عند شحن الطلب",
            })),
          });
        }
      }
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/stock");
}

export async function deleteOrder(orderId: string) {
  await requireAdmin();
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/admin/orders");
}
