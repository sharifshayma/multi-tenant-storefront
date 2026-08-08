import { prisma } from "@/lib/prisma";
import { customDomainSlug } from "@/lib/custom-domains";
import type { Store } from "@prisma/client";

export { storeHref } from "@/lib/store-href";

export async function resolveStorefrontContext(input: {
  slugParam: string | null;
  host: string;
}): Promise<{ store: Store; basePath: string } | null> {
  const domainSlug = customDomainSlug(input.host);
  const slug = domainSlug ?? input.slugParam;
  if (!slug) return null;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return null;
  const basePath = domainSlug ? "" : `/${store.slug}`;
  return { store, basePath };
}
