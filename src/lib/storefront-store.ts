import { prisma } from "@/lib/prisma";
import type { Store } from "@prisma/client";

/**
 * Resolves the request Host header to the store whose storefront should be
 * served. Matches a store's `customDomain` first; if none matches (e.g. on
 * localhost, or any host without a dedicated domain yet), falls back to the
 * primary store — tenant #1, the earliest-created store. Returns null only
 * when no stores exist at all.
 */
export async function resolveStorefrontStore(host: string): Promise<Store | null> {
  const byDomain = await prisma.store.findFirst({ where: { customDomain: host } });
  if (byDomain) return byDomain;
  return prisma.store.findFirst({ orderBy: { createdAt: "asc" } });
}
