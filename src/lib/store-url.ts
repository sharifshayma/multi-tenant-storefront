// Public storefront URLs for a store. Used server-side (reads BETTER_AUTH_URL)
// and the resulting strings are passed to client components as props.
function platformOrigin(): string {
  return (process.env.BETTER_AUTH_URL || "https://store.thatsmy.app").replace(/\/$/, "");
}

export function platformStoreUrl(slug: string): string {
  return `${platformOrigin()}/${slug}`;
}

export function storefrontUrls(store: { slug: string; customDomain: string | null }): {
  platform: string;
  customDomain: string | null;
} {
  return {
    platform: platformStoreUrl(store.slug),
    customDomain: store.customDomain ? `https://${store.customDomain}` : null,
  };
}
