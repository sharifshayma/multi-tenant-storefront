import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getBooks, getCollections } from "@/lib/data";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { storeNoun } from "@/lib/store-noun";
import { BookCard } from "@/components/storefront/BookCard";
import { CollectionCard } from "@/components/storefront/CollectionCard";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function StoreHome({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const d = getDictionary(ctx.store.uiLocale as Locale);
  const { plural } = storeNoun(ctx.store);

  const [books, collections] = await Promise.all([
    getBooks(ctx.store.id),
    getCollections(ctx.store.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
          {ctx.store.heroTitle ?? ctx.store.name}
        </h1>
        {ctx.store.heroSubtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-muted">{ctx.store.heroSubtitle}</p>
        )}
      </section>

      {collections.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-5 text-xl font-extrabold text-ink sm:text-2xl">
            {t(d, "store.home.collectionsHeading")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                basePath={ctx.basePath}
                currency={ctx.store.currency}
                locale={ctx.store.defaultLocale}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-5 text-xl font-extrabold text-ink sm:text-2xl">
          {t(d, "store.home.individualHeading", { plural })}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              basePath={ctx.basePath}
              currency={ctx.store.currency}
              locale={ctx.store.defaultLocale}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
