import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { getBookOrderHistory } from "@/lib/data";
import { BookEditForm } from "@/components/admin/BookEditForm";
import { BookCoverCard } from "@/components/admin/BookCoverCard";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaList } from "@/components/admin/MediaList";
import { ArchiveToggleButton } from "@/components/admin/ArchiveToggleButton";
import { StatusBadge } from "@/components/ui/Badge";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { singular, plural } = storeNoun(store);
  const d = getDictionary(store.uiLocale as Locale);

  const { id } = await params;
  const [book, orderHistory] = await Promise.all([
    prisma.book.findFirst({
      where: { id, storeId: store.id },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    }),
    getBookOrderHistory(id, store.id),
  ]);
  if (!book) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/books"
          className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
        >
          <ArrowRight className="h-4 w-4" />
          {t(d, "admin.products.backToItems", { plural })}
        </Link>
        <ArchiveToggleButton bookId={book.id} isArchived={book.isArchived} itemNounSingular={singular} />
      </div>

      {book.isArchived && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
          {t(d, "admin.products.archivedNotice", { singular })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <BookCoverCard bookId={book.id} coverImage={book.coverImage} title={book.title} />
        <BookEditForm
          bookId={book.id}
          title={book.title}
          description={book.description}
          priceMinor={book.priceMinor}
          currency={store.currency}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 font-extrabold">
          {t(d, "admin.products.orderHistory.heading", { n: orderHistory.length })}
        </h2>
        {orderHistory.length === 0 ? (
          <p className="text-sm text-muted">{t(d, "admin.products.orderHistory.empty", { singular })}</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {orderHistory.map((entry, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/orders/${entry.orderId}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {entry.customerName}
                    </Link>
                    <StatusBadge
                      status={entry.orderStatus}
                      label={t(d, `admin.orders.status.${entry.orderStatus}`)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>
                      {entry.source === "مباشر"
                        ? t(d, "admin.products.orderHistory.directOrder")
                        : t(d, "admin.products.orderHistory.withinCollection", { name: entry.source })}
                    </span>
                    <span>× {entry.quantity}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {new Intl.DateTimeFormat(store.uiLocale, { dateStyle: "medium" }).format(entry.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-muted">
                    <th className="p-3">{t(d, "admin.products.orderHistory.table.customer")}</th>
                    <th className="p-3">{t(d, "admin.products.orderHistory.table.type")}</th>
                    <th className="p-3">{t(d, "admin.products.orderHistory.table.quantity")}</th>
                    <th className="p-3">{t(d, "admin.products.orderHistory.table.status")}</th>
                    <th className="p-3">{t(d, "admin.products.orderHistory.table.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((entry, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3">
                        <Link
                          href={`/admin/orders/${entry.orderId}`}
                          className="font-bold text-brand hover:underline"
                        >
                          {entry.customerName}
                        </Link>
                      </td>
                      <td className="p-3">
                        {entry.source === "مباشر"
                          ? t(d, "admin.products.orderHistory.direct")
                          : t(d, "admin.products.orderHistory.collectionPrefix", { name: entry.source })}
                      </td>
                      <td className="p-3">{entry.quantity}</td>
                      <td className="p-3">
                        <StatusBadge
                          status={entry.orderStatus}
                          label={t(d, `admin.orders.status.${entry.orderStatus}`)}
                        />
                      </td>
                      <td className="p-3 text-muted">
                        {new Intl.DateTimeFormat(store.uiLocale, { dateStyle: "short" }).format(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">{t(d, "admin.products.additionalMedia")}</h2>
          <MediaUploader bookId={book.id} />
        </div>
        <MediaList
          bookId={book.id}
          media={book.media.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            sortOrder: m.sortOrder,
          }))}
        />
      </div>
    </div>
  );
}
