"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.$transaction([
    prisma.collectionBook.deleteMany({ where: { collectionId } }),
    prisma.collectionBook.createMany({
      data: bookIds.map((bookId, index) => ({ collectionId, bookId, sortOrder: index })),
    }),
  ]);
  await revalidateCollection(collectionId);
}
