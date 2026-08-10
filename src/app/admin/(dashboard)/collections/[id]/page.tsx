import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { CollectionEditForm } from "@/components/admin/CollectionEditForm";
import { CollectionBooksPicker } from "@/components/admin/CollectionBooksPicker";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function AdminCollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { plural } = storeNoun(store);
  const d = getDictionary(store.uiLocale as Locale);

  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { id, storeId: store.id },
    include: { books: { select: { bookId: true } } },
  });
  if (!collection) notFound();

  const allBooks = await prisma.book.findMany({
    where: { storeId: store.id },
    orderBy: { position: "asc" },
    select: { id: true, slug: true, title: true, description: true, priceMinor: true, coverImage: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/collections"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        {t(d, "admin.collections.backToCollections")}
      </Link>

      <CollectionEditForm
        collectionId={collection.id}
        title={collection.title}
        description={collection.description}
        priceMinor={collection.priceMinor}
        isCustom={collection.isCustom}
        requiredCount={collection.requiredCount}
        itemNounPlural={plural}
        currency={store.currency}
      />

      {collection.isCustom ? (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">{t(d, "admin.collections.customNote", { plural })}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 font-extrabold">{t(d, "admin.collections.itemsInCollection", { plural })}</h2>
          <CollectionBooksPicker
            collectionId={collection.id}
            books={allBooks}
            initialSelectedIds={collection.books.map((b) => b.bookId)}
            itemNounPlural={plural}
          />
        </div>
      )}
    </div>
  );
}
