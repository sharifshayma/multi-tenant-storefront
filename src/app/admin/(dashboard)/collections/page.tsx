import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");

  const collections = await prisma.collection.findMany({
    where: { storeId: store.id },
    orderBy: { position: "asc" },
    include: { _count: { select: { books: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">المجموعات</h1>
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
                {c.isCustom ? `تختار العميلة ${c.requiredCount ?? ""} كتب` : `${c._count.books} كتب ثابتة`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
