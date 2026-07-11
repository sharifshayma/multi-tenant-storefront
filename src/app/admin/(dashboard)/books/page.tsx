import Link from "next/link";
import Image from "next/image";
import { Plus, Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Price } from "@/components/ui/Price";
import { getBookDemand } from "@/lib/data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tabs: { value: "active" | "archived" | "all"; label: string }[] = [
  { value: "active", label: "نشطة" },
  { value: "archived", label: "مؤرشفة" },
  { value: "all", label: "الكل" },
];

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const filter = tab === "archived" || tab === "all" ? tab : "active";

  const [books, demand] = await Promise.all([
    prisma.book.findMany({
      where: filter === "active" ? { isArchived: false } : filter === "archived" ? { isArchived: true } : undefined,
      orderBy: { position: "asc" },
      include: { _count: { select: { media: true } } },
    }),
    getBookDemand(),
  ]);

  const demandById = new Map(demand.map((d) => [d.id, d]));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">سجل الطلب على الكتب</h1>
          <p className="mt-1 text-sm text-muted">
            ترتيب تنازلي حسب عدد مرات الطلب — يشمل الطلبات المباشرة وظهور الكتاب ضمن أي مجموعة (قد يُحسب الكتاب أكثر من
            مرة، وهذا مقصود لقياس الطلب الفعلي).
          </p>
        </div>
        {demand.every((d) => d.totalCount === 0) ? (
          <p className="text-muted">لا توجد طلبات بعد.</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-2 sm:hidden">
              {demand.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/admin/books/${d.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
                >
                  <span className="w-4 shrink-0 text-sm text-muted">{i + 1}</span>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                    <Image src={d.coverImage} alt={d.title} fill sizes="40px" className="object-contain p-0.5" />
                  </span>
                  <span className="line-clamp-1 min-w-0 flex-1 text-sm font-bold text-brand">{d.title}</span>
                  <span className="shrink-0 text-end">
                    <span className="block font-extrabold text-brand">{d.totalCount}</span>
                    <span className="block text-xs text-muted">{d.directCount}+{d.collectionCount}</span>
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-muted">
                    <th className="p-3">#</th>
                    <th className="p-3">الكتاب</th>
                    <th className="p-3">طلبات مباشرة</th>
                    <th className="p-3">ضمن مجموعات</th>
                    <th className="p-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.map((d, i) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-muted">{i + 1}</td>
                      <td className="p-3">
                        <Link
                          href={`/admin/books/${d.id}`}
                          className="flex items-center gap-3 font-bold text-brand hover:underline"
                        >
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                            <Image src={d.coverImage} alt={d.title} fill sizes="40px" className="object-contain p-0.5" />
                          </span>
                          <span className="line-clamp-1">{d.title}</span>
                        </Link>
                      </td>
                      <td className="p-3">{d.directCount}</td>
                      <td className="p-3">{d.collectionCount}</td>
                      <td className="p-3 font-extrabold text-brand">{d.totalCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">الكتب والوسائط</h2>
          <Link
            href="/admin/books/new"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            إضافة كتاب جديد
          </Link>
        </div>

        <div className="flex gap-2 border-b border-border pb-2">
          {tabs.map((t) => (
            <Link
              key={t.value}
              href={t.value === "active" ? "/admin/books" : `/admin/books?tab=${t.value}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-bold",
                t.value === filter
                  ? "bg-brand text-white"
                  : "border border-border bg-white text-muted hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {books.length === 0 ? (
          <p className="text-muted">لا توجد كتب في هذا القسم.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border bg-white p-4 hover:shadow-md",
                  book.isArchived ? "border-border opacity-60" : "border-border"
                )}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold">{book.title}</p>
                    {book.isArchived && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        <Archive className="h-3 w-3" />
                        مؤرشف
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted">
                    <Price nis={book.priceNis} />
                    <span>{book._count.media} ملف وسائط إضافي</span>
                    <span>طُلب {demandById.get(book.id)?.totalCount ?? 0} مرة</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
