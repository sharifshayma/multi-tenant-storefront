-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_storeId_fkey";

-- DropIndex
DROP INDEX "Book_slug_key";

-- DropIndex
DROP INDEX "Collection_slug_key";

-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "storeId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Book_storeId_slug_key" ON "Book"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_storeId_slug_key" ON "Collection"("storeId", "slug");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

