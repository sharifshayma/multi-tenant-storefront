import { prisma } from "@/lib/prisma";

/**
 * Whether moving an order to SHIPPED or DELIVERED automatically deducts the
 * ordered books from stock. Stored as a string "true"/"false" in the Setting
 * table; defaults to ON when the row is absent.
 */
export const AUTO_STOCK_SETTING_KEY = "autoStockOnFulfillment";

export async function getAutoStockEnabled(): Promise<boolean> {
  const row = await prisma.setting.findUnique({
    where: { key: AUTO_STOCK_SETTING_KEY },
  });
  // Default ON when the setting has never been written.
  return row ? row.value === "true" : true;
}

export async function setAutoStockEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? "true" : "false";
  await prisma.setting.upsert({
    where: { key: AUTO_STOCK_SETTING_KEY },
    create: { key: AUTO_STOCK_SETTING_KEY, value },
    update: { value },
  });
}
