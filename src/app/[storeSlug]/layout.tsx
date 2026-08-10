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

  // Storefront colors: a store's own colors, else neutral defaults so an
  // unconfigured store looks unbranded — NOT the platform's warm book palette
  // (which stays the admin-dashboard default in globals.css :root). The book
  // store keeps its warm look because the backfill writes its colors explicitly.
  const brand = store.brandColor ?? "#3d6b99";
  const accent = store.accentColor ?? "#3f8f79";
  const gold = store.goldColor ?? "#c9a24b";
  const brandStyle = {
    "--brand": brand,
    "--brand-dark": `color-mix(in srgb, ${brand} 82%, #000)`,
    "--accent": accent,
    "--gold": gold,
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="flex min-h-full flex-col">
      <SiteHeader basePath={ctx.basePath} name={store.name} logoUrl={store.logoUrl} />
      <main className="flex-1">{children}</main>
      <SiteFooter footerText={store.footerText} />
    </div>
  );
}
