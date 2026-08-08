import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { getBookOrderHistory } from "@/lib/data";
import { BookEditForm } from "@/components/admin/BookEditForm";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaList } from "@/components/admin/MediaList";
import { ArchiveToggleButton } from "@/components/admin/ArchiveToggleButton";
import { StatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");

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
          العودة إلى الكتب
        </Link>
        <ArchiveToggleButton bookId={book.id} isArchived={book.isArchived} />
      </div>

      {book.isArchived && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
          هذا الكتاب مؤرشف حالياً ولا يظهر للعملاء في المتجر.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="160px"
            className="object-contain p-3"
          />
        </div>
        <BookEditForm
          bookId={book.id}
          title={book.title}
          description={book.description}
          priceNis={book.priceNis}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 font-extrabold">سجل الطلبات ({orderHistory.length})</h2>
        {orderHistory.length === 0 ? (
          <p className="text-sm text-muted">لم يُطلب هذا الكتاب بعد.</p>
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
                    <StatusBadge status={entry.orderStatus} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{entry.source === "مباشر" ? "طلب مباشر" : `ضمن مجموعة: ${entry.source}`}</span>
                    <span>× {entry.quantity}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(entry.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-muted">
                    <th className="p-3">العميل</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">حالة الطلب</th>
                    <th className="p-3">التاريخ</th>
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
                        {entry.source === "مباشر" ? "مباشر" : `مجموعة: ${entry.source}`}
                      </td>
                      <td className="p-3">{entry.quantity}</td>
                      <td className="p-3">
                        <StatusBadge status={entry.orderStatus} />
                      </td>
                      <td className="p-3 text-muted">
                        {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(entry.createdAt)}
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
          <h2 className="font-extrabold">صور وفيديوهات إضافية</h2>
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
