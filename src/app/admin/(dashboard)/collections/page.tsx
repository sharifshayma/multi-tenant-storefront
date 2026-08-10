import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { Price } from "@/components/ui/Price";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { plural } = storeNoun(store);
  const d = getDictionary(store.uiLocale as Locale);

  const collections = await prisma.collection.findMany({
    where: { storeId: store.id },
    orderBy: { position: "asc" },
    include: { _count: { select: { books: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t(d, "admin.nav.collections")}</h1>
        <Link
          href="/admin/collections/new"
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          {t(d, "admin.collections.create")}
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-white p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Layers className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-extrabold">{t(d, "admin.collections.empty.heading")}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              {t(d, "admin.collections.empty.description", { plural })}
            </p>
            <ul className="flex max-w-2xl list-disc flex-col gap-1 pe-5 text-sm leading-relaxed text-muted">
              <li>
                <span className="font-bold text-ink">{t(d, "admin.collections.types.fixed.label")}</span>{" "}
                {t(d, "admin.collections.empty.fixedDescription", { plural })}
              </li>
              <li>
                <span className="font-bold text-ink">{t(d, "admin.collections.types.custom.label")}</span>{" "}
                {t(d, "admin.collections.empty.customDescription", { plural })}
              </li>
            </ul>
          </div>
          <Link
            href="/admin/collections/new"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            {t(d, "admin.collections.createFirst")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/admin/collections/${c.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 hover:shadow-md"
            >
              <p className="font-bold">{c.title}</p>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Price minor={c.priceMinor} currency={store.currency} locale={store.defaultLocale} />
                <span>
                  {c.isCustom
                    ? t(d, "admin.collections.list.customSummary", { count: c.requiredCount ?? "", plural })
                    : t(d, "admin.collections.list.fixedSummary", { count: c._count.books, plural })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
