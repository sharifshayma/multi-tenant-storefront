import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { getFinanceSummary, getStockLevels } from "@/lib/data";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");

  const [newCount, totalCount, bookCount, collectionCount, finance, stockLevels] = await Promise.all([
    prisma.order.count({ where: { status: "NEW", storeId: store.id } }),
    prisma.order.count({ where: { storeId: store.id } }),
    prisma.book.count({ where: { storeId: store.id } }),
    prisma.collection.count({ where: { storeId: store.id } }),
    getFinanceSummary(store.id),
    getStockLevels(store.id),
  ]);

  const totalStockUnits = stockLevels.reduce((sum, b) => sum + b.currentStock, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">أهلاً بك</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <Link
          href="/admin/finance"
          className="rounded-2xl border border-border bg-card p-6 hover:shadow-md"
        >
          <p className="text-sm text-muted">الصافي المالي</p>
          <Price
            minor={finance.net}
            currency={store.currency}
            locale={store.defaultLocale}
            className={`mt-2 block text-3xl font-extrabold ${finance.net >= 0 ? "text-brand" : "text-red-600"}`}
          />
        </Link>
        <Link
          href="/admin/stock"
          className="rounded-2xl border border-border bg-card p-6 hover:shadow-md"
        >
          <p className="text-sm text-muted">إجمالي المخزون</p>
          <p className="mt-2 text-3xl font-extrabold">{totalStockUnits}</p>
        </Link>
      </div>
    </div>
  );
}
