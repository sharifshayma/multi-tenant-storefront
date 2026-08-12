import { PrismaClient } from "@prisma/client";
import { books, collections, customCollection } from "./demo-data/catalog";

const prisma = new PrismaClient();

async function main() {
  // Tenant #1: seed data belongs to the store adopted by scripts/adopt-store.ts.
  // Run `npm run adopt-store -- <owner-email>` first if this store doesn't exist yet.
  const store = await prisma.store.findUnique({ where: { slug: "shaymas-books" } });
  if (!store) {
    throw new Error(
      'No store with slug "shaymas-books" found. Run `npm run adopt-store -- <owner-email>` before seeding.',
    );
  }

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    await prisma.book.upsert({
      where: { storeId_slug: { storeId: store.id, slug: book.slug } },
      update: {
        title: book.title,
        description: book.description,
        position: i,
      },
      create: {
        slug: book.slug,
        title: book.title,
        description: book.description,
        coverImage: `/images/books/${book.slug}/cover.jpg`,
        position: i,
        storeId: store.id,
      },
    });
  }
  console.log(`Seeded ${books.length} books.`);

  for (let i = 0; i < collections.length; i++) {
    const c = collections[i];
    const collection = await prisma.collection.upsert({
      where: { storeId_slug: { storeId: store.id, slug: c.slug } },
      update: {
        title: c.title,
        description: c.description,
        priceMinor: c.priceMinor,
        position: i,
      },
      create: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        priceMinor: c.priceMinor,
        position: i,
        storeId: store.id,
      },
    });

    const bookRecords = await prisma.book.findMany({
      where: { storeId: store.id, slug: { in: c.bookSlugs } },
      select: { id: true, slug: true },
    });
    const bookIdBySlug = new Map(bookRecords.map((b) => [b.slug, b.id]));

    for (let j = 0; j < c.bookSlugs.length; j++) {
      const bookId = bookIdBySlug.get(c.bookSlugs[j]);
      if (!bookId) continue;
      await prisma.collectionBook.upsert({
        where: { collectionId_bookId: { collectionId: collection.id, bookId } },
        update: { sortOrder: j },
        create: { collectionId: collection.id, bookId, sortOrder: j },
      });
    }
  }
  console.log(`Seeded ${collections.length} fixed collections.`);

  await prisma.collection.upsert({
    where: { storeId_slug: { storeId: store.id, slug: customCollection.slug } },
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
      storeId: store.id,
    },
  });
  console.log("Seeded custom build-your-own collection.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
