import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { customDomainSlug } from "@/lib/custom-domains";
import type { Store } from "@prisma/client";

export { storeHref } from "@/lib/store-href";

// Memoized on the two primitive inputs (not on `input` itself, since callers
// each build a fresh object literal — React.cache compares object arguments
// by reference, so keying on the object would never dedupe across the
// layout + page calls this exists to collapse into one store lookup).
const resolveStorefrontContextByKey = cache(
  async (slugParam: string | null, host: string): Promise<{ store: Store; basePath: string } | null> => {
    const domainSlug = customDomainSlug(host);
    const slug = domainSlug ?? slugParam;
    if (!slug) return null;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return null;
    const basePath = domainSlug ? "" : `/${store.slug}`;
    return { store, basePath };
  }
);

export async function resolveStorefrontContext(input: {
  slugParam: string | null;
  host: string;
}): Promise<{ store: Store; basePath: string } | null> {
  return resolveStorefrontContextByKey(input.slugParam, input.host);
}
