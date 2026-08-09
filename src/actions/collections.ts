"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";

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
