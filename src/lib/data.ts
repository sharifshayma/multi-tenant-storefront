import { prisma } from "@/lib/prisma";
import type { BookDetail, BookSummary } from "@/lib/types";

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
