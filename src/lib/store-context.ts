import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import type { Store } from "@prisma/client";

export const getCurrentStore = cache(async (): Promise<Store | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.store.findFirst({ where: { ownerId: user.id } });
});

export async function requireStore(): Promise<Store> {
  const store = await getCurrentStore();
  if (!store) throw new Error("No store");
  return store;
}
