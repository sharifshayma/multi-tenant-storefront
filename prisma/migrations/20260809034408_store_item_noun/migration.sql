-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "itemNounPlural" TEXT NOT NULL DEFAULT 'منتجات',
ADD COLUMN     "itemNounSingular" TEXT NOT NULL DEFAULT 'منتج';
