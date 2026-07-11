import { prisma } from "@/lib/prisma";
import type { BookDetail, BookSummary, CollectionSummary } from "@/lib/types";
import type { OrderStatus } from "@prisma/client";

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

export type PrintListEntry = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  quantity: number;
};

/**
 * How many physical copies of each book are needed, counting only orders in
 * the given status (defaults to CONFIRMED — the point at which an order is
 * locked in and ready to prepare). A book counts once per unit needed,
 * whether ordered on its own or as part of a collection.
 */
export async function getPrintList(status: OrderStatus = "CONFIRMED"): Promise<PrintListEntry[]> {
  const [books, directItems, collectionBookItems] = await Promise.all([
    prisma.book.findMany({
      orderBy: { position: "asc" },
      select: { id: true, slug: true, title: true, coverImage: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status } },
      select: { bookId: true, quantity: true },
    }),
    prisma.orderCollectionItemBook.findMany({
      where: { orderCollectionItem: { order: { status } } },
      select: { bookId: true, orderCollectionItem: { select: { quantity: true } } },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const item of directItems) {
    counts.set(item.bookId, (counts.get(item.bookId) ?? 0) + item.quantity);
  }
  for (const item of collectionBookItems) {
    counts.set(
      item.bookId,
      (counts.get(item.bookId) ?? 0) + item.orderCollectionItem.quantity
    );
  }

  return books
    .map((book) => ({ ...book, quantity: counts.get(book.id) ?? 0 }))
    .filter((book) => book.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);
}

export type BookOrderHistoryEntry = {
  orderId: string;
  customerName: string;
  orderStatus: OrderStatus;
  createdAt: Date;
  quantity: number;
  /** "مباشر" for a standalone order, or the collection's title if it was bundled */
  source: string;
};

/** Every order that included this book, whether ordered on its own or bundled inside a collection — newest first. */
export async function getBookOrderHistory(bookId: string): Promise<BookOrderHistoryEntry[]> {
  const [directItems, collectionItems] = await Promise.all([
    prisma.orderItem.findMany({
      where: { bookId },
      select: {
        quantity: true,
        order: { select: { id: true, customerName: true, status: true, createdAt: true } },
      },
    }),
    prisma.orderCollectionItemBook.findMany({
      where: { bookId },
      select: {
        orderCollectionItem: {
          select: {
            quantity: true,
            collection: { select: { title: true } },
            order: { select: { id: true, customerName: true, status: true, createdAt: true } },
          },
        },
      },
    }),
  ]);

  const entries: BookOrderHistoryEntry[] = [
    ...directItems.map((i) => ({
      orderId: i.order.id,
      customerName: i.order.customerName,
      orderStatus: i.order.status,
      createdAt: i.order.createdAt,
      quantity: i.quantity,
      source: "مباشر",
    })),
    ...collectionItems.map((ci) => ({
      orderId: ci.orderCollectionItem.order.id,
      customerName: ci.orderCollectionItem.order.customerName,
      orderStatus: ci.orderCollectionItem.order.status,
      createdAt: ci.orderCollectionItem.order.createdAt,
      quantity: ci.orderCollectionItem.quantity,
      source: ci.orderCollectionItem.collection.title,
    })),
  ];

  return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export type StockLevel = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  priceNis: number;
  currentStock: number;
};

/** Current stock per book, computed as the running sum of all stock movements (an append-only ledger, never a mutable counter). */
export async function getStockLevels(): Promise<StockLevel[]> {
  const [books, sums] = await Promise.all([
    prisma.book.findMany({
      orderBy: { position: "asc" },
      select: { id: true, slug: true, title: true, coverImage: true, priceNis: true },
    }),
    prisma.stockMovement.groupBy({ by: ["bookId"], _sum: { quantity: true } }),
  ]);
  const stockByBook = new Map(sums.map((s) => [s.bookId, s._sum.quantity ?? 0]));
  return books.map((book) => ({ ...book, currentStock: stockByBook.get(book.id) ?? 0 }));
}

export type OrderOption = {
  id: string;
  customerName: string;
  totalNis: number;
  createdAt: Date;
};

/** Lightweight order list for the transaction/stock-movement "link to order" picker. */
export async function getOrdersForSelect(): Promise<OrderOption[]> {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, customerName: true, totalNis: true, createdAt: true },
  });
}

export type FinanceSummary = {
  totalRevenue: number;
  totalExpense: number;
  net: number;
};

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const [revenue, expense] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "REVENUE" }, _sum: { amountNis: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amountNis: true } }),
  ]);
  const totalRevenue = revenue._sum.amountNis ?? 0;
  const totalExpense = expense._sum.amountNis ?? 0;
  return { totalRevenue, totalExpense, net: totalRevenue - totalExpense };
}

export type ForecastedRevenueOrder = {
  id: string;
  customerName: string;
  status: OrderStatus;
  outstandingNis: number;
};

export type ForecastedRevenue = {
  totalNis: number;
  orders: ForecastedRevenueOrder[];
};

/**
 * Money still expected from orders that are NEW or CONFIRMED but not fully
 * recorded as revenue yet — i.e. what's left to collect on orders in the
 * pipeline. A projection, not booked income: excludes orders already paid
 * in full, and nets out any partial payment already logged.
 */
export async function getForecastedRevenue(): Promise<ForecastedRevenue> {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["NEW", "CONFIRMED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      status: true,
      totalNis: true,
      transactions: { where: { type: "REVENUE" }, select: { amountNis: true } },
    },
  });

  const result: ForecastedRevenueOrder[] = [];
  let totalNis = 0;
  for (const order of orders) {
    const paid = order.transactions.reduce((sum, t) => sum + t.amountNis, 0);
    const outstanding = Math.max(0, order.totalNis - paid);
    if (outstanding > 0) {
      result.push({
        id: order.id,
        customerName: order.customerName,
        status: order.status,
        outstandingNis: outstanding,
      });
      totalNis += outstanding;
    }
  }
  return { totalNis, orders: result };
}

/** Amount paid so far per order, keyed by orderId — the sum of REVENUE transactions linked to it. Used for the payment badge on the orders list. */
export async function getOrderPaymentTotals(): Promise<Map<string, number>> {
  const sums = await prisma.transaction.groupBy({
    by: ["orderId"],
    where: { type: "REVENUE", orderId: { not: null } },
    _sum: { amountNis: true },
  });
  const map = new Map<string, number>();
  for (const s of sums) {
    if (s.orderId) map.set(s.orderId, s._sum.amountNis ?? 0);
  }
  return map;
}
