"use server";

import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import type { MediaType } from "@prisma/client";

async function revalidateBook(bookId: string, storeId: string) {
  const book = await prisma.book.findFirst({
    where: { id: bookId, storeId },
    select: { slug: true },
  });
  if (book) revalidatePath(`/books/${book.slug}`);
  revalidatePath(`/admin/books/${bookId}`);
}

export async function attachMedia(input: {
  bookId: string;
  url: string;
  type: MediaType;
}) {
  const store = await requireStore();
  const book = await prisma.book.findFirst({
    where: { id: input.bookId, storeId: store.id },
    select: { id: true },
  });
  if (!book) throw new Error("الكتاب غير موجود");
  const maxOrder = await prisma.bookMedia.aggregate({
    where: { bookId: input.bookId },
    _max: { sortOrder: true },
  });
  await prisma.bookMedia.create({
    data: {
      bookId: input.bookId,
      url: input.url,
      type: input.type,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  await revalidateBook(input.bookId, store.id);
}

export async function deleteMedia(mediaId: string) {
  const store = await requireStore();
  const media = await prisma.bookMedia.findFirst({
    where: { id: mediaId, book: { storeId: store.id } },
  });
  if (!media) return;
  await prisma.bookMedia.delete({ where: { id: mediaId } });
  try {
    await del(media.url);
  } catch (err) {
    console.error("Failed to delete blob", err);
  }
  await revalidateBook(media.bookId, store.id);
}

export async function reorderMedia(bookId: string, orderedIds: string[]) {
  const store = await requireStore();
  const book = await prisma.book.findFirst({
    where: { id: bookId, storeId: store.id },
    select: { id: true },
  });
  if (!book) throw new Error("الكتاب غير موجود");
  // Only touch media rows that actually belong to this book, so a caller
  // can't smuggle another book's media id into the ordered list.
  const ownedMedia = await prisma.bookMedia.findMany({
    where: { id: { in: orderedIds }, bookId },
    select: { id: true },
  });
  const ownedIds = new Set(ownedMedia.map((m) => m.id));
  await prisma.$transaction(
    orderedIds
      .filter((id) => ownedIds.has(id))
      .map((id, index) =>
        prisma.bookMedia.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
  );
  await revalidateBook(bookId, store.id);
}

export async function updateBook(input: {
  bookId: string;
  title: string;
  description: string;
  priceNis: number;
}) {
  const store = await requireStore();
  const result = await prisma.book.updateMany({
    where: { id: input.bookId, storeId: store.id },
    data: {
      title: input.title,
      description: input.description,
      priceNis: input.priceNis,
    },
  });
  if (result.count === 0) throw new Error("الكتاب غير موجود");
  await revalidateBook(input.bookId, store.id);
  revalidatePath("/admin/books");
  revalidatePath("/");
}
