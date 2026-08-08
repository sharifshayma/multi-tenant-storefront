"use server";

import { revalidatePath } from "next/cache";
import { requireStore } from "@/lib/store-context";
import { setAutoStockEnabled } from "@/lib/settings";

export async function updateAutoStockSetting(enabled: boolean) {
  const store = await requireStore();
  await setAutoStockEnabled(store.id, enabled);
  revalidatePath("/admin/settings");
}
