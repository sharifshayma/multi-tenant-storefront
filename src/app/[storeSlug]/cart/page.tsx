import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveStorefrontContext } from "@/lib/storefront-context";
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

  return <CartPageClient basePath={ctx.basePath} storeSlug={storeSlug} />;
}
