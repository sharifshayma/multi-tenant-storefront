"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStore } from "@/lib/store-context";
import { validateStoreSlug } from "@/lib/store-slug";

export async function updateStoreSlug(
  input: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const store = await requireStore();
  const v = validateStoreSlug(input);
  if (!v.ok) return v;
  if (v.slug === store.slug) return { ok: true, slug: v.slug };

  const taken = await prisma.store.findUnique({ where: { slug: v.slug } });
  if (taken) return { ok: false, error: "هذا العنوان مستخدم من متجر آخر" };

  await prisma.store.update({ where: { id: store.id }, data: { slug: v.slug } });
  revalidatePath("/admin/settings");
  return { ok: true, slug: v.slug };
}
