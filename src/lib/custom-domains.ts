// Static custom-domain -> store slug map. Proxy runs on the Edge and cannot
// query the DB, so custom domains are configured here (mirrors Store.customDomain).
// Self-serve custom domains for other stores are out of scope (later plan).
export const DOMAIN_TO_STORE_SLUG: Record<string, string> = {
  "arabstories.shayma.me": "shaymas-books",
};

export function customDomainSlug(host: string): string | null {
  const clean = host.toLowerCase().split(":")[0].trim();
  return DOMAIN_TO_STORE_SLUG[clean] ?? null;
}
