"use server";

import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import type { MediaType } from "@prisma/client";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
