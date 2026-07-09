import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [newCount, totalCount, bookCount, collectionCount] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count(),
    prisma.book.count(),
    prisma.collection.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">أهلاً بك</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/orders"
          className="rounded-2xl border border-border bg-card p-6 hover:shadow-md"
        >
          <p className="text-sm text-muted">طلبات جديدة</p>
          <p className="mt-2 text-3xl font-extrabold text-brand">{newCount}</p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-2xl border border-border bg-card p-6 hover:shadow-md"
        >
          <p className="text-sm text-muted">إجمالي الطلبات</p>
          <p className="mt-2 text-3xl font-extrabold">{totalCount}</p>
        </Link>
        <Link
          href="/admin/books"
          className="rounded-2xl border border-border bg-card p-6 hover:shadow-md"
        >
          <p className="text-sm text-muted">الكتب</p>
          <p className="mt-2 text-3xl font-extrabold">{bookCount}</p>
        </Link>
        <Link
          href="/admin/collections"
          className="rounded-2xl border border-border bg-card p-6 hover:shadow-md"
        >
          <p className="text-sm text-muted">المجموعات</p>
          <p className="mt-2 text-3xl font-extrabold">{collectionCount}</p>
        </Link>
      </div>
    </div>
  );
}
