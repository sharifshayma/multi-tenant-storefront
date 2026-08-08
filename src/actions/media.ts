"use server";

import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import type { MediaType } from "@prisma/client";

async function revalidateBook(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
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
  await requireUser();
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
  await revalidateBook(input.bookId);
}

export async function deleteMedia(mediaId: string) {
  await requireUser();
  const media = await prisma.bookMedia.findUnique({ where: { id: mediaId } });
  if (!media) return;
  await prisma.bookMedia.delete({ where: { id: mediaId } });
  try {
    await del(media.url);
  } catch (err) {
    console.error("Failed to delete blob", err);
  }
  await revalidateBook(media.bookId);
}

export async function reorderMedia(bookId: string, orderedIds: string[]) {
  await requireUser();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.bookMedia.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
  await revalidateBook(bookId);
}

export async function updateBook(input: {
  bookId: string;
  title: string;
  description: string;
  priceNis: number;
}) {
  await requireUser();
  await prisma.book.update({
    where: { id: input.bookId },
    data: {
      title: input.title,
      description: input.description,
      priceNis: input.priceNis,
    },
  });
  await revalidateBook(input.bookId);
  revalidatePath("/admin/books");
  revalidatePath("/");
}
