import type { Store } from "@prisma/client";
import { getDictionary, type Locale } from "@/i18n";

// The platform's default item noun (the DB column defaults). A store that
// hasn't set its own noun gets a locale-appropriate word ("product"/"products"
// in English, "منتج"/"منتجات" in Arabic); a store that DID set its own noun
// (e.g. the bookstore's "كتاب"/"كتب") keeps it verbatim — that's user data.
const DEFAULT_SINGULAR = "منتج";
const DEFAULT_PLURAL = "منتجات";

/**
 * Resolves the per-store product noun, localized for the store's UI language
 * when the store is still on the platform default.
 */
export function storeNoun(
  store: Pick<Store, "itemNounSingular" | "itemNounPlural" | "uiLocale">,
) {
  const usesDefault =
    store.itemNounSingular === DEFAULT_SINGULAR && store.itemNounPlural === DEFAULT_PLURAL;
  if (usesDefault) {
    const d = getDictionary(store.uiLocale as Locale);
    return { singular: d.common.product.singular, plural: d.common.product.plural };
  }
  return { singular: store.itemNounSingular, plural: store.itemNounPlural };
}
