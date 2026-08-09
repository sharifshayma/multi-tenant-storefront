-- Data-preserving rename: money fields move from whole-currency-unit `*Nis`
-- columns to integer minor-unit `*Minor` columns, then existing values are
-- multiplied by 100 to convert from whole units to minor units.
--
-- IMPORTANT: this ×100 transform is a one-time conversion. Do not run this
-- migration (or replay this file) against a database that has already had
-- its money values converted to minor units.

-- Rename columns (data-preserving; do NOT drop/add, which would lose data)
ALTER TABLE "Book" RENAME COLUMN "priceNis" TO "priceMinor";
ALTER TABLE "Collection" RENAME COLUMN "priceNis" TO "priceMinor";
ALTER TABLE "Order" RENAME COLUMN "totalNis" TO "totalMinor";
ALTER TABLE "Order" RENAME COLUMN "discountNis" TO "discountMinor";
ALTER TABLE "OrderItem" RENAME COLUMN "unitPriceNis" TO "unitPriceMinor";
ALTER TABLE "OrderCollectionItem" RENAME COLUMN "unitPriceNis" TO "unitPriceMinor";
ALTER TABLE "Transaction" RENAME COLUMN "amountNis" TO "amountMinor";

-- Convert existing values from whole units to minor units (×100)
UPDATE "Book" SET "priceMinor" = "priceMinor" * 100;
UPDATE "Collection" SET "priceMinor" = "priceMinor" * 100;
UPDATE "Order" SET "totalMinor" = "totalMinor" * 100, "discountMinor" = "discountMinor" * 100;
UPDATE "OrderItem" SET "unitPriceMinor" = "unitPriceMinor" * 100;
UPDATE "OrderCollectionItem" SET "unitPriceMinor" = "unitPriceMinor" * 100;
UPDATE "Transaction" SET "amountMinor" = "amountMinor" * 100;
