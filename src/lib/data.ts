import { prisma } from "@/lib/prisma";
import type { BookDetail, BookSummary, CollectionSummary } from "@/lib/types";

export async function getBooks(): Promise<BookSummary[]> {
  return prisma.book.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceNis: true,
      coverImage: true,
    },
  });
}

export async function getBookBySlug(slug: string): Promise<BookDetail | null> {
  return prisma.book.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceNis: true,
      coverImage: true,
      media: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, type: true, url: true, sortOrder: true },
      },
    },
  });
}

function toCollectionSummary(c: {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceNis: number;
  isCustom: boolean;
  requiredCount: number | null;
  books: { sortOrder: number; book: { id: string; slug: string; title: string; coverImage: string } }[];
}): CollectionSummary {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    priceNis: c.priceNis,
    isCustom: c.isCustom,
    requiredCount: c.requiredCount,
    books: [...c.books]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cb) => ({
        bookId: cb.book.id,
        slug: cb.book.slug,
        title: cb.book.title,
        coverImage: cb.book.coverImage,
      })),
  };
}

export async function getCollections(): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: {
      books: {
        select: { sortOrder: true, book: { select: { id: true, slug: true, title: true, coverImage: true } } },
      },
    },
  });
  return collections.map(toCollectionSummary);
}

export async function getCollectionBySlug(slug: string): Promise<CollectionSummary | null> {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      books: {
        select: { sortOrder: true, book: { select: { id: true, slug: true, title: true, coverImage: true } } },
      },
    },
  });
  return collection ? toCollectionSummary(collection) : null;
}
