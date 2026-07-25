-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountNis" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountReason" TEXT;
