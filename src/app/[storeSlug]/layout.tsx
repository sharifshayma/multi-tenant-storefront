import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { dirFor, type Locale } from "@/i18n";
import { LocaleProvider } from "@/i18n/LocaleProvider";

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
  const locale = (store.uiLocale ?? "en") as Locale;

  // Storefront colors: a store's own colors, else neutral defaults so an
  // unconfigured store looks unbranded — NOT the platform's warm book palette
  // (which stays the admin-dashboard default in globals.css :root). The book
  // store keeps its warm look because the backfill writes its colors explicitly.
  const brand = store.brandColor ?? "#3d6b99";
  const paper = store.backgroundColor ?? "#f6f6f7";
  const ink = store.textColor ?? "#22262e";
  const brandStyle = {
    "--brand": brand,
    "--brand-dark": `color-mix(in srgb, ${brand} 82%, #000)`,
    "--paper": paper,
    "--ink": ink,
    // Card surface derived from the background: ~white on light backgrounds,
    // an elevated lighter shade on dark ones — so text (--ink) stays readable
    // on cards under any theme.
    "--card": `color-mix(in srgb, ${paper} 85%, #fff)`,
    // Secondary text + borders blend the text color toward the background, so
    // they stay legible and on-theme under any background (no fixed greys).
    "--muted": `color-mix(in srgb, ${ink} 58%, ${paper})`,
    "--border": `color-mix(in srgb, ${ink} 16%, ${paper})`,
  } as React.CSSProperties;

  return (
    // bg-paper/text-ink paint the store's own background + text (the vars above),
    // overriding the platform defaults for this storefront only.
    <div
      style={brandStyle}
      dir={dirFor(locale)}
      lang={locale}
      className="flex min-h-full flex-col bg-paper text-ink"
    >
      <LocaleProvider locale={locale}>
        <SiteHeader basePath={ctx.basePath} name={store.name} logoUrl={store.logoUrl} />
        <main className="flex-1">{children}</main>
        <SiteFooter footerText={store.footerText} />
      </LocaleProvider>
    </div>
  );
}
