"use server";

import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { uniqueStoreSlug } from "@/lib/store-slug";

type SignupResult = { ok: true } | { ok: false; error: string };

export async function signUpAndCreateStore(input: SignupInput): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { email, password, storeName } = parsed.data;

  let userId: string;
  try {
    const result = await auth.api.signUpEmail({ body: { email, password, name: storeName } });
    userId = result.user.id;
  } catch (error) {
    return { ok: false, error: mapSignUpError(error) };
  }

  const slug = await uniqueStoreSlug(storeName, (slug) =>
    prisma.store.findUnique({ where: { slug } }).then(Boolean)
  );

  await prisma.store.create({
    data: { slug, name: storeName, ownerId: userId },
  });

  return { ok: true };
}

function mapSignUpError(error: unknown): string {
  const message =
    error instanceof Error
      ? (error as { body?: { message?: string } }).body?.message ?? error.message
      : "";
  if (message.includes("USER_ALREADY_EXISTS")) {
    return "هذا البريد الإلكتروني مستخدم بالفعل";
  }
  return "تعذّر إنشاء الحساب، حاول مرة أخرى";
}
