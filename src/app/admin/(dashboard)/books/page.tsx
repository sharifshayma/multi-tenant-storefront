import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { Price } from "@/components/ui/Price";
import { getBookDemand } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { singular, plural } = storeNoun(store);
  const d = getDictionary(store.uiLocale as Locale);

  const tabs: { value: "active" | "archived" | "all"; label: string }[] = [
    { value: "active", label: t(d, "admin.products.tabs.active") },
    { value: "archived", label: t(d, "admin.products.tabs.archived") },
    { value: "all", label: t(d, "admin.products.tabs.all") },
  ];

  const { tab } = await searchParams;
  const filter = tab === "archived" || tab === "all" ? tab : "active";

  const [books, demand] = await Promise.all([
    prisma.book.findMany({
      where: {
        storeId: store.id,
        ...(filter === "active" ? { isArchived: false } : filter === "archived" ? { isArchived: true } : {}),
      },
      orderBy: { position: "asc" },
      include: { _count: { select: { media: true } } },
    }),
    getBookDemand(store.id),
  ]);

  const demandById = new Map(demand.map((entry) => [entry.id, entry]));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t(d, "admin.products.demand.title", { plural })}</h1>
          <p className="mt-1 text-sm text-muted">
            {t(d, "admin.products.demand.subtitle", { singular })}
          </p>
        </div>
        {demand.every((entry) => entry.totalCount === 0) ? (
          <p className="text-muted">{t(d, "admin.products.demand.empty")}</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-2 sm:hidden">
              {demand.map((entry, i) => (
                <Link
                  key={entry.id}
                  href={`/admin/books/${entry.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
                >
                  <span className="w-4 shrink-0 text-sm text-muted">{i + 1}</span>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                    <Image src={entry.coverImage} alt={entry.title} fill sizes="40px" className="object-contain p-0.5" />
                  </span>
                  <span className="line-clamp-1 min-w-0 flex-1 text-sm font-bold text-brand">{entry.title}</span>
                  <span className="shrink-0 text-end">
                    <span className="block font-extrabold text-brand">{entry.totalCount}</span>
                    <span className="block text-xs text-muted">{entry.directCount}+{entry.collectionCount}</span>
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-end text-muted">
                    <th className="p-3">#</th>
                    <th className="p-3">{t(d, "admin.products.demand.itemColumn", { singular })}</th>
                    <th className="p-3">{t(d, "admin.products.demand.directOrders")}</th>
                    <th className="p-3">{t(d, "admin.products.demand.inCollections")}</th>
                    <th className="p-3">{t(d, "admin.products.demand.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.map((entry, i) => (
                    <tr key={entry.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-muted">{i + 1}</td>
                      <td className="p-3">
                        <Link
                          href={`/admin/books/${entry.id}`}
                          className="flex items-center gap-3 font-bold text-brand hover:underline"
                        >
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                            <Image src={entry.coverImage} alt={entry.title} fill sizes="40px" className="object-contain p-0.5" />
                          </span>
                          <span className="line-clamp-1">{entry.title}</span>
                        </Link>
                      </td>
                      <td className="p-3">{entry.directCount}</td>
                      <td className="p-3">{entry.collectionCount}</td>
                      <td className="p-3 font-extrabold text-brand">{entry.totalCount}</td>
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
          <h2 className="text-xl font-extrabold">{t(d, "admin.nav.itemsAndMedia", { plural })}</h2>
          <Link
            href="/admin/books/new"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            {t(d, "admin.products.addNew", { singular })}
          </Link>
        </div>

        <div className="flex gap-2 border-b border-border pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value === "active" ? "/admin/books" : `/admin/books?tab=${tab.value}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-bold",
                tab.value === filter
                  ? "bg-brand text-white"
                  : "border border-border bg-white text-muted hover:text-ink"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {books.length === 0 ? (
          <p className="text-muted">{t(d, "admin.products.empty", { plural })}</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border bg-white p-4 hover:shadow-md sm:w-80",
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
                        {t(d, "admin.products.archivedBadge")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-col gap-1 text-sm text-muted">
                    <Price
                      minor={book.priceMinor}
                      currency={store.currency}
                      locale={store.uiLocale}
                      className="font-bold text-ink"
                    />
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="whitespace-nowrap">
                        {t(d, "admin.products.mediaCount", { n: book._count.media })}
                      </span>
                      <span className="whitespace-nowrap">
                        {t(d, "admin.products.orderedCount", { n: demandById.get(book.id)?.totalCount ?? 0 })}
                      </span>
                    </div>
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
