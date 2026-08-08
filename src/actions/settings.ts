"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { setAutoStockEnabled } from "@/lib/settings";

export async function updateAutoStockSetting(enabled: boolean) {
  await requireUser();
  await setAutoStockEnabled(enabled);
  revalidatePath("/admin/settings");
}
