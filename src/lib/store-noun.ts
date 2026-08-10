import type { Store } from "@prisma/client";

/**
 * Resolves the per-store product noun (e.g. "كتاب"/"كتب" for the bookstore,
 * "منتج"/"منتجات" for a generic store) from the store's own fields.
 *
 * Not touched for i18n: these are per-store DB values the store owner sets
 * (or a DB-column default for stores that haven't), not app chrome — same
 * category as book/collection titles. Left as-is.
 */
export function storeNoun(store: Pick<Store, "itemNounSingular" | "itemNounPlural">) {
  return { singular: store.itemNounSingular, plural: store.itemNounPlural };
}
