// Static custom-domain -> store slug map. Proxy runs on the Edge and cannot
// query the DB, so custom domains are configured here (mirrors Store.customDomain).
// Self-serve custom domains for other stores are out of scope (later plan).
export const DOMAIN_TO_STORE_SLUG: Record<string, string> = {
  "shop.example.com": "my-store",
};

export function customDomainSlug(host: string): string | null {
  const clean = host.toLowerCase().split(":")[0].trim();
  return DOMAIN_TO_STORE_SLUG[clean] ?? null;
}

// Pure decision function for the Edge proxy: on a custom-domain host, bare
// storefront paths (e.g. "/", "/books/x") are rewritten to "/{slug}/..." so
// the bookstore keeps its exact current bare URLs. Admin/api/login/signup
// paths and non-custom-domain hosts are left untouched (returns null).
export function storefrontRewritePath(host: string, pathname: string): string | null {
  const slug = customDomainSlug(host);
  if (!slug) return null;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    /^\/(icon|apple-icon|opengraph-image|favicon|robots\.txt|sitemap\.xml|\.well-known)/.test(pathname) ||
    // Static assets under public/ (e.g. /images/books/x/cover.jpg, /*.svg): a
    // file extension in the last path segment means it's an asset, not a
    // storefront route (routes like /books/{slug} have no dot). Without this,
    // the rewrite turns /images/... into /{slug}/images/... and the file 404s.
    /\.[a-z0-9]+$/i.test(pathname)
  ) return null;
  return pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
}
