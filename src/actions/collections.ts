"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import { slugify } from "@/lib/slugify";

export type CreateCollectionResult =
  | { ok: true; collectionId: string }
  | { ok: false; error: string };

export async function createCollection(input: {
  title: string;
  slug: string;
  description: string;
  priceMinor: number;
  isCustom: boolean;
  requiredCount?: number;
}): Promise<CreateCollectionResult> {
  const store = await requireStore();

  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) return { ok: false, error: "الرجاء إدخال عنوان المجموعة" };
  if (!Number.isFinite(input.priceMinor) || input.priceMinor <= 0) {
    return { ok: false, error: "الرجاء إدخال سعر صحيح" };
  }
  if (input.isCustom) {
    if (!input.requiredCount || input.requiredCount < 1) {
      return { ok: false, error: "الرجاء تحديد عدد صحيح تختاره العميلة" };
    }
  }

  // Auto-dedupe the slug so a non-technical user never hits a raw unique
  // constraint: base -> base-2 -> base-3 ... within this store.
  const base = slugify(input.slug.trim() || title);
  const taken = new Set(
    (
      await prisma.collection.findMany({
        where: { storeId: store.id, slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((c) => c.slug)
  );
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

  const maxPosition = await prisma.collection.aggregate({
    where: { storeId: store.id },
    _max: { position: true },
  });

  const collection = await prisma.collection.create({
    data: {
      title,
      slug,
      description,
      priceMinor: Math.round(input.priceMinor),
      isCustom: input.isCustom,
      requiredCount: input.isCustom ? input.requiredCount : null,
      position: (maxPosition._max.position ?? 0) + 1,
      storeId: store.id,
    },
  });

  revalidatePath("/admin/collections");
  revalidatePath("/");
  return { ok: true, collectionId: collection.id };
}

async function revalidateCollection(collectionId: string, storeId: string) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, storeId },
    select: { slug: true },
  });
  if (collection) revalidatePath(`/collections/${collection.slug}`);
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/admin/collections");
  revalidatePath("/");
}

export async function updateCollection(input: {
  collectionId: string;
  title: string;
  description: string;
  priceMinor: number;
  requiredCount?: number | null;
}) {
  const store = await requireStore();
  const result = await prisma.collection.updateMany({
    where: { id: input.collectionId, storeId: store.id },
    data: {
      title: input.title,
      description: input.description,
      priceMinor: input.priceMinor,
      ...(input.requiredCount !== undefined ? { requiredCount: input.requiredCount } : {}),
    },
  });
  if (result.count === 0) throw new Error("المجموعة غير موجودة");
  await revalidateCollection(input.collectionId, store.id);
}

export async function setCollectionBooks(collectionId: string, bookIds: string[]) {
  const store = await requireStore();
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, storeId: store.id },
    select: { id: true },
  });
  if (!collection) throw new Error("المجموعة غير موجودة");
  if (bookIds.length > 0) {
    const ownedCount = await prisma.book.count({
      where: { id: { in: bookIds }, storeId: store.id },
    });
    if (ownedCount !== bookIds.length) throw new Error("أحد الكتب لا ينتمي إلى هذا المتجر");
  }
  await prisma.$transaction([
    prisma.collectionBook.deleteMany({ where: { collectionId } }),
    prisma.collectionBook.createMany({
      data: bookIds.map((bookId, index) => ({ collectionId, bookId, sortOrder: index })),
    }),
  ]);
  await revalidateCollection(collectionId, store.id);
}
