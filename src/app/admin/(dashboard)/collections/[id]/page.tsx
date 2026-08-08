import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { CollectionEditForm } from "@/components/admin/CollectionEditForm";
import { CollectionBooksPicker } from "@/components/admin/CollectionBooksPicker";

export const dynamic = "force-dynamic";

export default async function AdminCollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");

  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { id, storeId: store.id },
    include: { books: { select: { bookId: true } } },
  });
  if (!collection) notFound();

  const allBooks = await prisma.book.findMany({
    where: { storeId: store.id },
    orderBy: { position: "asc" },
    select: { id: true, slug: true, title: true, description: true, priceNis: true, coverImage: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/collections"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى المجموعات
      </Link>

      <CollectionEditForm
        collectionId={collection.id}
        title={collection.title}
        description={collection.description}
        priceNis={collection.priceNis}
        isCustom={collection.isCustom}
        requiredCount={collection.requiredCount}
      />

      {collection.isCustom ? (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">
            هذه مجموعة "اختاري بنفسك" — العميلة تختار الكتب بنفسها عند الطلب، لذا لا توجد كتب ثابتة لتحديدها هنا.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 font-extrabold">الكتب في هذه المجموعة</h2>
          <CollectionBooksPicker
            collectionId={collection.id}
            books={allBooks}
            initialSelectedIds={collection.books.map((b) => b.bookId)}
          />
        </div>
      )}
    </div>
  );
}
