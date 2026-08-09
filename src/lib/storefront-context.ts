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
    // Custom-domain hosts resolve the store BY HOST (not by a slug in the static
    // map), so an operator can change their slug without breaking their domain.
    if (customDomainSlug(host)) {
      const cleanHost = host.toLowerCase().split(":")[0].trim();
      const store = await prisma.store.findUnique({ where: { customDomain: cleanHost } });
      if (!store) return null;
      return { store, basePath: "" };
    }
    // Platform host: resolve by the URL slug.
    if (!slugParam) return null;
    const store = await prisma.store.findUnique({ where: { slug: slugParam } });
    if (!store) return null;
    return { store, basePath: `/${store.slug}` };
  }
);

export async function resolveStorefrontContext(input: {
  slugParam: string | null;
  host: string;
}): Promise<{ store: Store; basePath: string } | null> {
  return resolveStorefrontContextByKey(input.slugParam, input.host);
}
