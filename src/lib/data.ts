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

export type BookDemand = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  directCount: number;
  collectionCount: number;
  totalCount: number;
};

/**
 * Ranks books by total order demand, descending. A book ordered directly and
 * a book ordered as part of a collection both count toward its total —
 * double counting is intentional here, this measures demand signal per
 * book/story, not literal inventory drawn down.
 */
export async function getBookDemand(): Promise<BookDemand[]> {
  const [books, directItems, collectionBookItems] = await Promise.all([
    prisma.book.findMany({ select: { id: true, slug: true, title: true, coverImage: true } }),
    prisma.orderItem.findMany({ select: { bookId: true, quantity: true } }),
    prisma.orderCollectionItemBook.findMany({
      select: { bookId: true, orderCollectionItem: { select: { quantity: true } } },
    }),
  ]);

  const direct = new Map<string, number>();
  for (const item of directItems) {
    direct.set(item.bookId, (direct.get(item.bookId) ?? 0) + item.quantity);
  }

  const viaCollections = new Map<string, number>();
  for (const item of collectionBookItems) {
    viaCollections.set(
      item.bookId,
      (viaCollections.get(item.bookId) ?? 0) + item.orderCollectionItem.quantity
    );
  }

  return books
    .map((book) => {
      const directCount = direct.get(book.id) ?? 0;
      const collectionCount = viaCollections.get(book.id) ?? 0;
      return {
        ...book,
        directCount,
        collectionCount,
        totalCount: directCount + collectionCount,
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount);
}
