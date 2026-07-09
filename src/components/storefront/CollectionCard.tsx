import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { CollectionCollage } from "./CollectionCollage";
import type { CollectionSummary } from "@/lib/types";

export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  const originalPrice = collection.isCustom
    ? (collection.requiredCount ?? 0) * 40
    : collection.books.length * 40;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border-2 border-gold/40 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full">
        <CollectionCollage books={collection.books} isCustom={collection.isCustom} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-extrabold text-ink">{collection.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{collection.description}</p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Price nis={collection.priceNis} className="text-lg font-extrabold text-brand" />
          <Price
            nis={originalPrice}
            className="text-sm text-muted line-through decoration-brand/60"
          />
        </div>
      </div>
    </Link>
  );
}
