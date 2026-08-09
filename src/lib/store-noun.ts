import type { Store } from "@prisma/client";

/**
 * Resolves the per-store product noun (e.g. "كتاب"/"كتب" for the bookstore,
 * "منتج"/"منتجات" for a generic store) from the store's own fields.
 */
export function storeNoun(store: Pick<Store, "itemNounSingular" | "itemNounPlural">) {
  return { singular: store.itemNounSingular, plural: store.itemNounPlural };
}
