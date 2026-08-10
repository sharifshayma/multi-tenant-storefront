import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { plural } = storeNoun(store);

  const collections = await prisma.collection.findMany({
    where: { storeId: store.id },
    orderBy: { position: "asc" },
    include: { _count: { select: { books: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">المجموعات</h1>
        <Link
          href="/admin/collections/new"
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          إنشاء مجموعة
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-white p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Layers className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-extrabold">ما هي المجموعات؟</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              المجموعة هي عدة {plural} تُباع معاً بسعر واحد. يمكنكِ إنشاء نوعين:
            </p>
            <ul className="flex max-w-2xl list-disc flex-col gap-1 pr-5 text-sm leading-relaxed text-muted">
              <li>
                <span className="font-bold text-ink">مجموعة ثابتة</span> — أنتِ تحددين ال{plural} التي تتكوّن منها المجموعة.
              </li>
              <li>
                <span className="font-bold text-ink">اختاري بنفسك</span> — تحددين عدداً معيّناً، والعميلة تختار ال{plural} بنفسها عند الطلب.
              </li>
            </ul>
          </div>
          <Link
            href="/admin/collections/new"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            أنشئي أول مجموعة
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
                  {c.isCustom ? `تختار العميلة ${c.requiredCount ?? ""} ${plural}` : `${c._count.books} ${plural} ثابتة`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
