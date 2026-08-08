// Pure helper with no server-only dependencies (no prisma import), so it is
// safe to import from both Server and Client Components. storefront-context.ts
// re-exports this for callers that also need resolveStorefrontContext.
export function storeHref(basePath: string, path: string): string {
  return `${basePath}${path}`;
}
