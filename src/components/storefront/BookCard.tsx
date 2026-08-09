import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { storeHref } from "@/lib/store-href";
import { AddToCartButton } from "./AddToCartButton";
import type { BookSummary } from "@/lib/types";

export function BookCard({
  book,
  basePath,
  currency,
  locale,
}: {
  book: BookSummary;
  basePath: string;
  currency: string;
  locale: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={storeHref(basePath, `/books/${book.slug}`)} className="block">
        <div className="relative aspect-square w-full bg-white">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={storeHref(basePath, `/books/${book.slug}`)}>
          <h3 className="line-clamp-2 font-extrabold text-ink hover:text-brand">
            {book.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted">{book.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Price
            minor={book.priceMinor}
            currency={currency}
            locale={locale}
            className="text-lg font-extrabold text-brand"
          />
        </div>
        <AddToCartButton book={book} size="sm" compact />
      </div>
    </div>
  );
}
