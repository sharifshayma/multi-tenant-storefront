"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import { getDictionary, t, type Locale } from "@/i18n";

export type CreateBookResult = { ok: true; bookId: string } | { ok: false; error: string };

export async function createBook(input: {
  title: string;
  description: string;
  priceMinor: number;
  slug: string;
  coverImage: string;
}): Promise<CreateBookResult> {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);

  const title = input.title.trim();
  const description = input.description.trim();
  const slug = input.slug.trim();

  if (!title) return { ok: false, error: t(d, "errors.books.titleRequired") };
  if (!description) return { ok: false, error: t(d, "errors.books.descriptionRequired") };
  if (!slug) return { ok: false, error: t(d, "errors.books.slugRequired") };
  if (!input.coverImage) return { ok: false, error: t(d, "errors.books.coverImageRequired") };
  if (!Number.isFinite(input.priceMinor) || input.priceMinor <= 0) {
    return { ok: false, error: t(d, "errors.invalidPrice") };
  }

  // slug is unique per-store at the DB level, so the existence check is
  // scoped to the caller's store (also avoids leaking another store's slugs).
  const existing = await prisma.book.findFirst({ where: { storeId: store.id, slug } });
  if (existing) {
    return { ok: false, error: t(d, "errors.books.slugTaken") };
  }

  const maxPosition = await prisma.book.aggregate({
    where: { storeId: store.id },
    _max: { position: true },
  });

  const book = await prisma.book.create({
    data: {
      title,
      description,
      slug,
      coverImage: input.coverImage,
      priceMinor: Math.round(input.priceMinor),
      position: (maxPosition._max.position ?? 0) + 1,
      storeId: store.id,
    },
  });

  revalidatePath("/admin/books");
  revalidatePath("/");

  return { ok: true, bookId: book.id };
}

export async function setBookArchived(bookId: string, isArchived: boolean) {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);
  const book = await prisma.book.findFirst({
    where: { id: bookId, storeId: store.id },
    select: { slug: true },
  });
  if (!book) throw new Error(t(d, "errors.books.notFound"));
  await prisma.book.update({
    where: { id: bookId },
    data: { isArchived },
  });
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath("/");
  revalidatePath(`/books/${book.slug}`);
}
