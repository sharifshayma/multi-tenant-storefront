"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStore } from "@/lib/store-context";
import { validateStoreSlug } from "@/lib/store-slug";
import { isHexColor } from "@/lib/hex-color";
import { CURRENCY_CODES } from "@/lib/currencies";
import { getDictionary, t, type Locale } from "@/i18n";

export async function updateStoreCurrency(
  currency: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);
  if (!CURRENCY_CODES.has(currency)) {
    return { ok: false, error: t(d, "errors.store.unsupportedCurrency") };
  }
  await prisma.store.update({ where: { id: store.id }, data: { currency } });
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateStoreSlug(
  input: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);
  // validateStoreSlug returns an errors.* KEY (no store/locale context of
  // its own) — translate it here where the store's dictionary is available.
  const v = validateStoreSlug(input);
  if (!v.ok) return { ok: false, error: t(d, v.error) };
  if (v.slug === store.slug) return { ok: true, slug: v.slug };

  const taken = await prisma.store.findUnique({ where: { slug: v.slug } });
  if (taken) return { ok: false, error: t(d, "errors.slug.taken") };

  try {
    await prisma.store.update({ where: { id: store.id }, data: { slug: v.slug } });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { ok: false, error: t(d, "errors.slug.taken") };
    }
    throw err;
  }
  revalidatePath("/admin/settings");
  return { ok: true, slug: v.slug };
}

export type BrandingInput = {
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  logoUrl: string;
  brandColor: string;
  backgroundColor: string;
  textColor: string;
};

// "" -> null; a non-empty value must be valid hex or the whole action fails.
function colorOrNull(value: string): string | null | false {
  const v = value.trim();
  if (!v) return null;
  return isHexColor(v) ? v : false;
}

// "" -> null; a non-empty logo URL must be an https Vercel-blob URL (matches
// next.config remotePatterns) or the action fails — otherwise <Image> 500s.
function logoUrlOrNull(value: string): string | null | false {
  const v = value.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com")) return v;
  } catch {}
  return false;
}

export async function updateBranding(
  input: BrandingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);

  const name = input.name.trim();
  if (!name) return { ok: false, error: t(d, "errors.store.nameRequired") };

  const brandColor = colorOrNull(input.brandColor);
  const backgroundColor = colorOrNull(input.backgroundColor);
  const textColor = colorOrNull(input.textColor);
  const logoUrl = logoUrlOrNull(input.logoUrl);
  if (brandColor === false || backgroundColor === false || textColor === false) {
    return { ok: false, error: t(d, "errors.store.invalidColor") };
  }
  if (logoUrl === false) {
    return { ok: false, error: t(d, "errors.store.invalidLogoUrl") };
  }

  const orNull = (s: string) => (s.trim() ? s.trim() : null);

  await prisma.store.update({
    where: { id: store.id },
    data: {
      name,
      heroTitle: orNull(input.heroTitle),
      heroSubtitle: orNull(input.heroSubtitle),
      footerText: orNull(input.footerText),
      logoUrl,
      brandColor,
      backgroundColor,
      textColor,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function updateStoreUiLocale(
  locale: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await requireStore();
  const d = getDictionary(store.uiLocale as Locale);
  if (locale !== "ar" && locale !== "en") {
    return { ok: false, error: t(d, "errors.store.unsupportedLocale") };
  }
  await prisma.store.update({ where: { id: store.id }, data: { uiLocale: locale } });
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}
