import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getCollectionBySlug, getBooks } from "@/lib/data";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { DEFAULT_PRICE_MINOR } from "@/lib/constants";
import { Price } from "@/components/ui/Price";
import { AddCollectionToCartButton } from "@/components/storefront/AddCollectionToCartButton";
import { BundleBuilder } from "@/components/storefront/BundleBuilder";
import { CollectionCollage } from "@/components/storefront/CollectionCollage";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string; slug: string }>;
}) {
  const { storeSlug, slug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const collection = await getCollectionBySlug(slug, ctx.store.id);
  if (!collection) notFound();

  const originalPrice = collection.isCustom
    ? (collection.requiredCount ?? 0) * DEFAULT_PRICE_MINOR
    : collection.books.length * DEFAULT_PRICE_MINOR;

  if (collection.isCustom) {
    const books = await getBooks(ctx.store.id);
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{collection.title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-muted">{collection.description}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Price
              minor={collection.priceMinor}
              currency={ctx.store.currency}
              locale={ctx.store.defaultLocale}
              className="text-2xl font-extrabold text-brand"
            />
            <Price
              minor={originalPrice}
              currency={ctx.store.currency}
              locale={ctx.store.defaultLocale}
              className="text-muted line-through"
            />
          </div>
        </div>
        <BundleBuilder collection={collection} books={books} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border">
          <CollectionCollage books={collection.books} />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{collection.title}</h1>
          <div className="flex items-center gap-2">
            <Price
              minor={collection.priceMinor}
              currency={ctx.store.currency}
              locale={ctx.store.defaultLocale}
              className="text-2xl font-extrabold text-brand"
            />
            <Price
              minor={originalPrice}
              currency={ctx.store.currency}
              locale={ctx.store.defaultLocale}
              className="text-muted line-through"
            />
          </div>
          <p className="leading-relaxed text-ink/90">{collection.description}</p>

          <div className="flex flex-col gap-2">
            <p className="font-bold">تشمل المجموعة:</p>
            <ul className="flex flex-col gap-2">
              {collection.books.map((book) => (
                <li key={book.bookId} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>
                  <span className="text-sm">{book.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2">
            <AddCollectionToCartButton collection={collection} />
          </div>
          <p className="text-sm text-muted">
            بعد إتمام الطلب، سنتواصل معك هاتفياً لتنسيق التوصيل والدفع.
          </p>
        </div>
      </div>
    </div>
  );
}
