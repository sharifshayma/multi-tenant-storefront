import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/data";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { MediaGallery } from "@/components/storefront/MediaGallery";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ storeSlug: string; slug: string }>;
}) {
  const { storeSlug, slug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const book = await getBookBySlug(slug, ctx.store.id);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <MediaGallery
          coverImage={book.coverImage}
          title={book.title}
          media={book.media}
        />
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            {book.title}
          </h1>
          <Price nis={book.priceMinor} className="text-2xl font-extrabold text-brand" />
          <p className="leading-relaxed text-ink/90">{book.description}</p>
          <div className="mt-2">
            <AddToCartButton book={book} size="lg" />
          </div>
          <p className="text-sm text-muted">
            بعد إتمام الطلب، سنتواصل معك هاتفياً لتنسيق التوصيل والدفع.
          </p>
        </div>
      </div>
    </div>
  );
}
