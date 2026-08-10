import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) return {};
  return {
    title: ctx.store.name,
    ...(ctx.store.heroSubtitle ? { description: ctx.store.heroSubtitle } : {}),
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const { store } = ctx;

  const brandStyle = {
    ...(store.brandColor ? { "--brand": store.brandColor } : {}),
    ...(store.accentColor ? { "--accent": store.accentColor } : {}),
    ...(store.goldColor ? { "--gold": store.goldColor } : {}),
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="flex min-h-full flex-col">
      <SiteHeader basePath={ctx.basePath} name={store.name} logoUrl={store.logoUrl} />
      <main className="flex-1">{children}</main>
      <SiteFooter footerText={store.footerText} />
    </div>
  );
}
