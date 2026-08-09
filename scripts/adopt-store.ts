import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/store-slug";
import type { Prisma } from "@prisma/client";

// Tenant #1: the existing bilingual bookstore ("Arab Roots, Global Wings",
// جذور عربية، أجنحة عالمية), adopted as the first store in a multi-tenant
// world. Money is NOT converted here — priceNis stays shekels, which is
// correct for an ILS store.
export const DEFAULT_STORE_SLUG = "shaymas-books";
export const DEFAULT_STORE_NAME = "Arab Roots, Global Wings";
export const DEFAULT_STORE_CURRENCY = "ILS";
export const DEFAULT_STORE_LOCALE = "ar";
export const DEFAULT_STORE_CUSTOM_DOMAIN = "arabstories.shayma.me";
export const DEFAULT_STORE_ITEM_NOUN_SINGULAR = "كتاب";
export const DEFAULT_STORE_ITEM_NOUN_PLURAL = "كتب";

export type BuildStoreDataOpts = {
  slug?: string;
  name?: string;
  currency?: string;
  defaultLocale?: string;
  customDomain?: string | null;
  itemNounSingular?: string;
  itemNounPlural?: string;
};

/**
 * Pure decision logic for the tenant #1 Store payload. Defaults describe the
 * bookstore being adopted; every field is overridable for other environments
 * or future re-use of this script.
 */
export function buildStoreData(
  ownerId: string,
  opts: BuildStoreDataOpts = {},
): Prisma.StoreUncheckedCreateInput {
  return {
    ownerId,
    slug: slugify(opts.slug ?? DEFAULT_STORE_SLUG),
    name: opts.name ?? DEFAULT_STORE_NAME,
    currency: opts.currency ?? DEFAULT_STORE_CURRENCY,
    defaultLocale: opts.defaultLocale ?? DEFAULT_STORE_LOCALE,
    customDomain:
      opts.customDomain === undefined ? DEFAULT_STORE_CUSTOM_DOMAIN : opts.customDomain,
    itemNounSingular: opts.itemNounSingular ?? DEFAULT_STORE_ITEM_NOUN_SINGULAR,
    itemNounPlural: opts.itemNounPlural ?? DEFAULT_STORE_ITEM_NOUN_PLURAL,
  };
}

async function adoptStore(ownerEmail: string, opts: BuildStoreDataOpts = {}) {
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    throw new Error(
      `No user found for ${ownerEmail}. Create it first with: npm run create-user -- ${ownerEmail} <password> "<name>"`,
    );
  }

  const data = buildStoreData(owner.id, opts);

  // Idempotent on slug: re-running this script does not create a duplicate
  // store or clobber an already-adopted one. The `update` clause is
  // deliberately narrow — it only (re)stamps the item-noun fields, so that
  // re-running this script against an already-adopted tenant #1 store (e.g.
  // at prod deploy, after this task ships) backfills "كتاب"/"كتب" onto a row
  // that was created before these columns existed. It does not touch other
  // already-adopted fields (name, currency, etc.).
  const store = await prisma.store.upsert({
    where: { slug: data.slug },
    update: {
      itemNounSingular: data.itemNounSingular,
      itemNounPlural: data.itemNounPlural,
    },
    create: data,
  });

  await prisma.$transaction(async (tx) => {
    // Stamp storeId on every existing row that hasn't been adopted yet.
    //
    // Raw SQL (not `updateMany({ where: { storeId: null } })`) deliberately:
    // the generated Prisma Client is compiled against the *current*
    // schema.prisma, where storeId is non-null, so a typed `storeId: null`
    // filter no longer compiles even though this script must also run
    // against a not-yet-migrated database (see the production note in the
    // task brief — adopt-store runs before `enforce_store_id_not_null` is
    // applied there). This is a safe no-op once the column is NOT NULL.
    for (const table of ["Book", "Collection", "Order", "Transaction", "StockMovement"]) {
      await tx.$executeRawUnsafe(
        `UPDATE "${table}" SET "storeId" = $1 WHERE "storeId" IS NULL`,
        store.id,
      );
    }

    // Move any global-key settings into this store's StoreSettings. Copied
    // (not deleted) so re-running stays a no-op and nothing else that might
    // still read the global Setting table breaks.
    const globalSettings = await tx.setting.findMany();
    for (const setting of globalSettings) {
      await tx.storeSettings.upsert({
        where: { storeId_key: { storeId: store.id, key: setting.key } },
        update: {},
        create: { storeId: store.id, key: setting.key, value: setting.value },
      });
    }
  });

  return store;
}

function parseArgs(argv: string[]): { ownerEmail: string } {
  const ownerEmail = argv[0] ?? process.env.ADOPT_STORE_OWNER_EMAIL;
  if (!ownerEmail) {
    throw new Error("Usage: npm run adopt-store -- <owner-email>");
  }
  return { ownerEmail };
}

async function main() {
  const { ownerEmail } = parseArgs(process.argv.slice(2));
  const store = await adoptStore(ownerEmail);
  console.log(`Adopted store "${store.name}" (${store.slug}) for ${ownerEmail}`);
}

// Only run when invoked directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith("adopt-store.ts")) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
