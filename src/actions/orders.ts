"use server";

import { prisma } from "@/lib/prisma";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { sendOrderNotification } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireStore } from "@/lib/store-context";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { getAutoStockEnabled } from "@/lib/settings";
import type { OrderStatus } from "@prisma/client";

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

  const ctx = await resolveStorefrontContext({
    slugParam: data.storeSlug,
    host: (await headers()).get("host") ?? "",
  });
  if (!ctx) {
    return { ok: false, error: "المتجر غير متوفر" };
  }
  const store = ctx.store;

  const bookIds = data.items.map((i) => i.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds }, storeId: store.id },
    select: { id: true, title: true, priceMinor: true },
  });
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const orderItems: {
    bookId: string;
    quantity: number;
    unitPriceMinor: number;
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
      unitPriceMinor: book.priceMinor,
      title: book.title,
    });
  }

  const collectionIds = data.collections.map((c) => c.collectionId);
  const collections = await prisma.collection.findMany({
    where: { id: { in: collectionIds }, storeId: store.id },
    include: { books: { select: { bookId: true } } },
  });
  const collectionMap = new Map(collections.map((c) => [c.id, c]));

  const allBookIds = new Set<string>();
  for (const c of data.collections) for (const id of c.selectedBookIds) allBookIds.add(id);
  const selectedBookRecords = await prisma.book.findMany({
    where: { id: { in: [...allBookIds] }, storeId: store.id },
    select: { id: true, title: true },
  });
  const selectedBookMap = new Map(selectedBookRecords.map((b) => [b.id, b]));

  const orderCollectionItems: {
    collectionId: string;
    quantity: number;
    unitPriceMinor: number;
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
      unitPriceMinor: collection.priceMinor,
      title: collection.title,
      bookIds,
      bookTitles: bookIds.map((id) => selectedBookMap.get(id)?.title ?? bookMap.get(id)?.title ?? ""),
    });
  }

  const totalMinor =
    orderItems.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0) +
    orderCollectionItems.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
      city: data.city,
      notes: data.notes || null,
      totalMinor,
      storeId: store.id,
      items: {
        create: orderItems.map((i) => ({
          bookId: i.bookId,
          quantity: i.quantity,
          unitPriceMinor: i.unitPriceMinor,
        })),
      },
      collectionItems: {
        create: orderCollectionItems.map((i) => ({
          collectionId: i.collectionId,
          quantity: i.quantity,
          unitPriceMinor: i.unitPriceMinor,
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
      totalMinor: order.totalMinor,
      items: orderItems.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
      })),
      collectionItems: orderCollectionItems.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
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
  const store = await requireStore();
  const updated = await prisma.order.updateMany({
    where: { id: orderId, storeId: store.id },
    data: { status },
  });
  if (updated.count === 0) throw new Error("الطلب غير موجود");

  // Fulfillment (SHIPPED or DELIVERED) auto-deducts the ordered books from
  // stock — but only when the feature is enabled, and only once per order:
  // a single fulfillment stock movement is created, so SHIPPED -> DELIVERED
  // (or a jump straight to DELIVERED) never double-counts.
  if (status === "SHIPPED" || status === "DELIVERED") {
    const autoStockEnabled = await getAutoStockEnabled(store.id);
    if (autoStockEnabled) {
      const alreadyDeducted = await prisma.stockMovement.findFirst({
        where: { orderId, type: "SHIPPED", storeId: store.id },
      });
      if (!alreadyDeducted) {
        const order = await prisma.order.findFirst({
          where: { id: orderId, storeId: store.id },
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
                note: "خصم تلقائي من المخزون حسب حالة الطلب",
                storeId: store.id,
              })),
            });
          }
        }
      }
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/stock");
}

export async function deleteOrder(orderId: string) {
  const store = await requireStore();
  const result = await prisma.order.deleteMany({ where: { id: orderId, storeId: store.id } });
  if (result.count === 0) throw new Error("الطلب غير موجود");
  revalidatePath("/admin/orders");
}

export type SetOrderDiscountResult = { ok: true } | { ok: false; error: string };

export async function setOrderDiscount(input: {
  orderId: string;
  discountMinor: number;
  discountReason?: string;
}): Promise<SetOrderDiscountResult> {
  const store = await requireStore();

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, storeId: store.id },
    select: { totalMinor: true },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود" };

  if (!Number.isFinite(input.discountMinor) || input.discountMinor < 0) {
    return { ok: false, error: "قيمة الخصم غير صالحة" };
  }
  const discountMinor = Math.round(input.discountMinor);
  if (discountMinor > order.totalMinor) {
    return { ok: false, error: "لا يمكن أن يتجاوز الخصم إجمالي الطلب" };
  }

  await prisma.order.updateMany({
    where: { id: input.orderId, storeId: store.id },
    data: {
      discountMinor,
      // Clear the reason when there is no discount, otherwise store the trimmed note.
      discountReason: discountMinor > 0 ? input.discountReason?.trim() || null : null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin");

  return { ok: true };
}

export async function updateOrderCustomerInfo(input: {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  city: string;
  notes?: string;
}) {
  const store = await requireStore();
  const customerName = input.customerName.trim();
  const phone = input.phone.trim();
  const city = input.city.trim();
  if (!customerName || !phone || !city) {
    throw new Error("الرجاء تعبئة الاسم والهاتف والمدينة");
  }
  const result = await prisma.order.updateMany({
    where: { id: input.orderId, storeId: store.id },
    data: {
      customerName,
      phone,
      email: input.email?.trim() || null,
      city,
      notes: input.notes?.trim() || null,
    },
  });
  if (result.count === 0) throw new Error("الطلب غير موجود");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderId}`);
}

export type UpdateOrderItemsResult = { ok: true } | { ok: false; error: string };

export async function updateOrderItems(input: {
  orderId: string;
  items: { bookId: string; quantity: number }[];
  collectionItems: { id: string; quantity: number }[];
}): Promise<UpdateOrderItemsResult> {
  const store = await requireStore();

  if (input.items.length === 0 && input.collectionItems.length === 0) {
    return { ok: false, error: "يجب أن يحتوي الطلب على كتاب واحد على الأقل" };
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, storeId: store.id },
    include: { collectionItems: true },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود" };
  if (order.status !== "NEW" && order.status !== "CONFIRMED") {
    return { ok: false, error: "لا يمكن تعديل محتويات الطلب بعد بدء التجهيز أو الشحن" };
  }

  const bookIds = input.items.map((i) => i.bookId);
  const books = bookIds.length
    ? await prisma.book.findMany({
        where: { id: { in: bookIds }, storeId: store.id },
        select: { id: true, priceMinor: true },
      })
    : [];
  const bookMap = new Map(books.map((b) => [b.id, b]));

  for (const item of input.items) {
    if (!bookMap.has(item.bookId)) return { ok: false, error: "أحد الكتب لم يعد متوفراً" };
    if (item.quantity < 1) return { ok: false, error: "الكمية يجب أن تكون ١ على الأقل" };
  }

  const existingCollectionMap = new Map(order.collectionItems.map((c) => [c.id, c]));
  for (const c of input.collectionItems) {
    if (!existingCollectionMap.has(c.id)) return { ok: false, error: "إحدى المجموعات لم تعد جزءاً من الطلب" };
    if (c.quantity < 1) return { ok: false, error: "الكمية يجب أن تكون ١ على الأقل" };
  }
  const keepIds = new Set(input.collectionItems.map((c) => c.id));
  const removedCollectionIds = order.collectionItems
    .filter((c) => !keepIds.has(c.id))
    .map((c) => c.id);

  const itemsTotal = input.items.reduce(
    (sum, i) => sum + (bookMap.get(i.bookId)?.priceMinor ?? 0) * i.quantity,
    0
  );
  const collectionsTotal = input.collectionItems.reduce((sum, c) => {
    const existing = existingCollectionMap.get(c.id)!;
    return sum + existing.unitPriceMinor * c.quantity;
  }, 0);
  const totalMinor = itemsTotal + collectionsTotal;
  // A discount can never exceed the (possibly reduced) order total.
  const discountMinor = Math.min(order.discountMinor, totalMinor);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: input.orderId } }),
    ...(removedCollectionIds.length
      ? [prisma.orderCollectionItem.deleteMany({ where: { id: { in: removedCollectionIds } } })]
      : []),
    ...input.collectionItems.map((c) =>
      prisma.orderCollectionItem.update({ where: { id: c.id }, data: { quantity: c.quantity } })
    ),
    prisma.order.updateMany({
      where: { id: input.orderId, storeId: store.id },
      data: { totalMinor, discountMinor },
    }),
    ...(input.items.length
      ? [
          prisma.orderItem.createMany({
            data: input.items.map((i) => ({
              orderId: input.orderId,
              bookId: i.bookId,
              quantity: i.quantity,
              unitPriceMinor: bookMap.get(i.bookId)!.priceMinor,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/admin/finance");

  return { ok: true };
}
