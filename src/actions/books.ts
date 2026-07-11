"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("Unauthorized");
}

export type CreateBookResult = { ok: true; bookId: string } | { ok: false; error: string };

export async function createBook(input: {
  title: string;
  description: string;
  priceNis: number;
  slug: string;
  coverImage: string;
}): Promise<CreateBookResult> {
  await requireAdmin();

  const title = input.title.trim();
  const description = input.description.trim();
  const slug = input.slug.trim();

  if (!title) return { ok: false, error: "الرجاء إدخال عنوان الكتاب" };
  if (!description) return { ok: false, error: "الرجاء إدخال وصف الكتاب" };
  if (!slug) return { ok: false, error: "الرجاء إدخال رابط (slug) للكتاب" };
  if (!input.coverImage) return { ok: false, error: "الرجاء رفع صورة الغلاف" };
  if (!Number.isFinite(input.priceNis) || input.priceNis <= 0) {
    return { ok: false, error: "الرجاء إدخال سعر صحيح" };
  }

  const existing = await prisma.book.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false, error: "هذا الرابط مستخدم بالفعل لكتاب آخر، الرجاء اختيار رابط مختلف" };
  }

  const maxPosition = await prisma.book.aggregate({ _max: { position: true } });

  const book = await prisma.book.create({
    data: {
      title,
      description,
      slug,
      coverImage: input.coverImage,
      priceNis: Math.round(input.priceNis),
      position: (maxPosition._max.position ?? 0) + 1,
    },
  });

  revalidatePath("/admin/books");
  revalidatePath("/");

  return { ok: true, bookId: book.id };
}

export async function setBookArchived(bookId: string, isArchived: boolean) {
  await requireAdmin();
  const book = await prisma.book.update({
    where: { id: bookId },
    data: { isArchived },
    select: { slug: true },
  });
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath("/");
  revalidatePath(`/books/${book.slug}`);
}
