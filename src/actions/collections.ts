"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";

async function revalidateCollection(collectionId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
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
  priceNis: number;
  requiredCount?: number | null;
}) {
  await requireUser();
  await prisma.collection.update({
    where: { id: input.collectionId },
    data: {
      title: input.title,
      description: input.description,
      priceNis: input.priceNis,
      ...(input.requiredCount !== undefined ? { requiredCount: input.requiredCount } : {}),
    },
  });
  await revalidateCollection(input.collectionId);
}

export async function setCollectionBooks(collectionId: string, bookIds: string[]) {
  await requireUser();
  await prisma.$transaction([
    prisma.collectionBook.deleteMany({ where: { collectionId } }),
    prisma.collectionBook.createMany({
      data: bookIds.map((bookId, index) => ({ collectionId, bookId, sortOrder: index })),
    }),
  ]);
  await revalidateCollection(collectionId);
}
