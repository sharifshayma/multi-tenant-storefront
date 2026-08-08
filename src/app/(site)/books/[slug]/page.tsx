import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/data";
import { resolveStorefrontStore } from "@/lib/storefront-store";
import { MediaGallery } from "@/components/storefront/MediaGallery";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await resolveStorefrontStore((await headers()).get("host") ?? "");
  if (!store) notFound();
  const book = await getBookBySlug(slug, store.id);
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
          <Price nis={book.priceNis} className="text-2xl font-extrabold text-brand" />
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
