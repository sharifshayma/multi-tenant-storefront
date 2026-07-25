"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { setAutoStockEnabled } from "@/lib/settings";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

export async function updateAutoStockSetting(enabled: boolean) {
  await requireAdmin();
  await setAutoStockEnabled(enabled);
  revalidatePath("/admin/settings");
}
