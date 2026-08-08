export const RESERVED_SLUGS = ["admin", "login", "signup", "api", "_next", "logout"];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

export async function uniqueStoreSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "store";
  let candidate = base;
  let n = 1;
  while (isReservedSlug(candidate) || (await exists(candidate))) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
