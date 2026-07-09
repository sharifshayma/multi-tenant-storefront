-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceNis" INTEGER NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "requiredCount" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionBook" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCollectionItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceNis" INTEGER NOT NULL,

    CONSTRAINT "OrderCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCollectionItemBook" (
    "id" TEXT NOT NULL,
    "orderCollectionItemId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "OrderCollectionItemBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_position_idx" ON "Collection"("position");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionBook_collectionId_bookId_key" ON "CollectionBook"("collectionId", "bookId");

-- AddForeignKey
ALTER TABLE "CollectionBook" ADD CONSTRAINT "CollectionBook_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionBook" ADD CONSTRAINT "CollectionBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCollectionItem" ADD CONSTRAINT "OrderCollectionItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCollectionItem" ADD CONSTRAINT "OrderCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCollectionItemBook" ADD CONSTRAINT "OrderCollectionItemBook_orderCollectionItemId_fkey" FOREIGN KEY ("orderCollectionItemId") REFERENCES "OrderCollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCollectionItemBook" ADD CONSTRAINT "OrderCollectionItemBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
