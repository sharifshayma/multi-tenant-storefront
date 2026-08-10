export const RESERVED_SLUGS = ["admin", "login", "signup", "api", "_next", "logout"];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['\u2019]/g, "")
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

export type SlugValidation =
  | { ok: true; slug: string }
  | { ok: false; error: string };

// Format + reserved-word validation for a store slug. Uniqueness is a DB
// concern and is checked in the action, not here.
//
// This helper has no store/locale context, so `error` is an `errors.*`
// dictionary KEY (e.g. "errors.slug.invalid"), not a translated message —
// the caller (which does have the store's dictionary) must translate it
// with `t(d, v.error)` before showing it to the user.
export function validateStoreSlug(input: string): SlugValidation {
  const slug = slugify(input);
  if (!slug) return { ok: false, error: "errors.slug.invalid" };
  if (isReservedSlug(slug)) {
    return { ok: false, error: "errors.slug.reserved" };
  }
  return { ok: true, slug };
}
