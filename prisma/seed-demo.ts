// prisma/seed-demo.ts
import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { buildStoreData } from "@/../scripts/adopt-store";
import { books, collections, customCollection } from "./demo-data/catalog";
import {
  DEMO_USER,
  DEMO_STORE,
  DEMO_BOOK_PRICE_MINOR,
  PRNG_SEED,
  WINDOW_DAYS,
  ORDER_COUNT,
} from "./demo-data/constants";
import { DEMO_CUSTOMERS } from "./demo-data/customers";
import { mulberry32 } from "./demo-data/prng";
import { generateOrders } from "./demo-data/generate-orders";
import { generateLedger } from "./demo-data/generate-ledger";

async function ensureDemoUser(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_USER.email } });
  if (existing) return existing.id;
  await auth.api.signUpEmail({
    body: { email: DEMO_USER.email, password: DEMO_USER.password, name: DEMO_USER.name },
  });
  const created = await prisma.user.findUnique({ where: { email: DEMO_USER.email } });
  if (!created) throw new Error("Failed to create demo user");
  return created.id;
}

async function ensureDemoStore(ownerId: string) {
  const data = buildStoreData(ownerId, {
    slug: DEMO_STORE.slug,
    name: DEMO_STORE.name,
    customDomain: null,
    defaultLocale: "en",
  });
  return prisma.store.upsert({
    where: { slug: DEMO_STORE.slug },
    // Apply the locale on re-seed too, so an existing demo store flips ar -> en.
    update: { defaultLocale: "en" },
    create: data,
  });
}

async function seedCatalog(storeId: string) {
  const bookIdBySlug = new Map<string, string>();
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const priceMinor = DEMO_BOOK_PRICE_MINOR[b.slug];
    const row = await prisma.book.upsert({
      where: { storeId_slug: { storeId, slug: b.slug } },
      update: { title: b.title, description: b.description, priceMinor, position: i },
      create: {
        slug: b.slug,
        title: b.title,
        description: b.description,
        priceMinor,
        coverImage: `/images/books/${b.slug}/cover.jpg`,
        position: i,
        storeId,
      },
    });
    bookIdBySlug.set(b.slug, row.id);
  }

  const collectionIdBySlug = new Map<string, string>();
  for (let i = 0; i < collections.length; i++) {
    const c = collections[i];
    const col = await prisma.collection.upsert({
      where: { storeId_slug: { storeId, slug: c.slug } },
      update: { title: c.title, description: c.description, priceMinor: c.priceMinor, position: i },
      create: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        priceMinor: c.priceMinor,
        position: i,
        storeId,
      },
    });
    collectionIdBySlug.set(c.slug, col.id);
    for (let j = 0; j < c.bookSlugs.length; j++) {
      const bookId = bookIdBySlug.get(c.bookSlugs[j]);
      if (!bookId) continue;
      await prisma.collectionBook.upsert({
        where: { collectionId_bookId: { collectionId: col.id, bookId } },
        update: { sortOrder: j },
        create: { collectionId: col.id, bookId, sortOrder: j },
      });
    }
  }

  const custom = await prisma.collection.upsert({
    where: { storeId_slug: { storeId, slug: customCollection.slug } },
    update: {
      title: customCollection.title,
      description: customCollection.description,
      priceMinor: customCollection.priceMinor,
      isCustom: true,
      requiredCount: customCollection.requiredCount,
      position: collections.length,
    },
    create: {
      slug: customCollection.slug,
      title: customCollection.title,
      description: customCollection.description,
      priceMinor: customCollection.priceMinor,
      isCustom: true,
      requiredCount: customCollection.requiredCount,
      position: collections.length,
      storeId,
    },
  });
  collectionIdBySlug.set(customCollection.slug, custom.id);

  return { bookIdBySlug, collectionIdBySlug };
}

async function resetTransactionalData(storeId: string) {
  await prisma.stockMovement.deleteMany({ where: { storeId } });
  await prisma.transaction.deleteMany({ where: { storeId } });
  // OrderItem / OrderCollectionItem / OrderCollectionItemBook cascade from Order.
  await prisma.order.deleteMany({ where: { storeId } });
}

// Remove the existing catalog so slugs dropped from the demo data don't
// linger. Must run AFTER resetTransactionalData (orders/stock reference books).
// CollectionBook and BookMedia cascade when their Collection/Book is deleted.
async function resetCatalog(storeId: string) {
  await prisma.collection.deleteMany({ where: { storeId } });
  await prisma.book.deleteMany({ where: { storeId } });
}

function requireId(map: Map<string, string>, key: string, kind: string): string {
  const id = map.get(key);
  if (!id) throw new Error(`Demo seed: missing ${kind} id for "${key}"`);
  return id;
}

async function main() {
  const ownerId = await ensureDemoUser();
  const store = await ensureDemoStore(ownerId);
  // Clear transactional data first (it references books), then wipe and
  // rebuild the catalog so removed slugs don't accumulate across re-seeds.
  // Progress logs: these DB writes to a remote database can take a while.
  console.log("Resetting demo data…");
  await resetTransactionalData(store.id);
  await resetCatalog(store.id);
  console.log("Rebuilding catalog (14 books, 5 collections)…");
  const { bookIdBySlug, collectionIdBySlug } = await seedCatalog(store.id);
  console.log("Generating orders & ledger…");

  const now = new Date();
  const orders = generateOrders({
    rng: mulberry32(PRNG_SEED),
    now,
    windowDays: WINDOW_DAYS,
    count: ORDER_COUNT,
    bookPrices: DEMO_BOOK_PRICE_MINOR,
    bookSlugs: books.map((b) => b.slug),
    collections: collections.map((c) => ({ slug: c.slug, priceMinor: c.priceMinor })),
    customCollection: {
      slug: customCollection.slug,
      priceMinor: customCollection.priceMinor,
      requiredCount: customCollection.requiredCount,
    },
    customers: DEMO_CUSTOMERS,
  });
  const { transactions, stockMovements } = generateLedger({
    rng: mulberry32(PRNG_SEED + 1),
    now,
    windowDays: WINDOW_DAYS,
    orders,
    bookSlugs: books.map((b) => b.slug),
  });

  const orderIdByRef = new Map<string, string>();
  for (const o of orders) {
    const created = await prisma.order.create({
      data: {
        customerName: o.customerName,
        phone: o.phone,
        email: o.email,
        city: o.city,
        notes: o.notes,
        status: o.status,
        totalMinor: o.totalMinor,
        discountMinor: o.discountMinor,
        discountReason: o.discountReason,
        createdAt: o.createdAt,
        storeId: store.id,
        items: {
          create: o.items.map((i) => ({
            bookId: requireId(bookIdBySlug, i.bookSlug, "book"),
            quantity: i.quantity,
            unitPriceMinor: i.unitPriceMinor,
          })),
        },
        collectionItems: {
          create: o.collectionItems.map((c) => ({
            collectionId: requireId(collectionIdBySlug, c.collectionSlug, "collection"),
            quantity: c.quantity,
            unitPriceMinor: c.unitPriceMinor,
            selectedBooks: {
              create: c.selectedBookSlugs.map((s) => ({ bookId: requireId(bookIdBySlug, s, "book") })),
            },
          })),
        },
      },
    });
    orderIdByRef.set(o.ref, created.id);
  }

  for (const t of transactions) {
    await prisma.transaction.create({
      data: {
        type: t.type,
        amountMinor: t.amountMinor,
        category: t.category,
        description: t.description,
        orderId: t.orderRef ? (orderIdByRef.get(t.orderRef) ?? null) : null,
        date: t.date,
        storeId: store.id,
      },
    });
  }

  for (const m of stockMovements) {
    await prisma.stockMovement.create({
      data: {
        bookId: requireId(bookIdBySlug, m.bookSlug, "book"),
        type: m.type,
        quantity: m.quantity,
        orderId: m.orderRef ? (orderIdByRef.get(m.orderRef) ?? null) : null,
        note: m.note,
        createdAt: m.createdAt,
        storeId: store.id,
      },
    });
  }

  console.log("\n✅ Demo environment seeded.");
  console.log(`   Store:    ${store.name} (/${store.slug})`);
  console.log(`   Login:    ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log(`   Orders:   ${orders.length}`);
  console.log(`   Ledger:   ${transactions.length} transactions, ${stockMovements.length} stock movements`);
  console.log("   Re-run `npm run seed:demo` anytime to reset the demo data.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
