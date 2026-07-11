-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Book_isArchived_idx" ON "Book"("isArchived");
