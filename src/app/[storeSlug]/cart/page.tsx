import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { storeNoun } from "@/lib/store-noun";
import { CartPageClient } from "@/components/storefront/CartPageClient";

export default async function CartPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const { plural } = storeNoun(ctx.store);

  return (
    <CartPageClient
      basePath={ctx.basePath}
      storeSlug={storeSlug}
      currency={ctx.store.currency}
      locale={ctx.store.uiLocale}
      itemNounPlural={plural}
    />
  );
}
