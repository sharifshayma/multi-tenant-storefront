"use server";

import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { uniqueStoreSlug } from "@/lib/store-slug";
import { getCurrentUser } from "@/lib/auth-guard";
import { getCurrentStore } from "@/lib/store-context";
import { getDictionary, t } from "@/i18n";

type SignupResult = { ok: true } | { ok: false; error: string };

// There's no store yet anywhere in this file (this is the pre-store signup
// flow), so every message is translated with the default "ar" dictionary —
// same simplification used for createOrder's pre-store-resolution path in
// src/actions/orders.ts.
const d = getDictionary("ar");

export async function signUpAndCreateStore(input: SignupInput): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t(d, parsed.error.issues[0]?.message ?? "auth.invalidData") };
  }
  const { email, password, storeName } = parsed.data;

  // Recovery path: the caller may already be authenticated but store-less —
  // e.g. signUpEmail succeeded (which sets the session cookie) on a previous
  // attempt but store creation then failed. Re-signing-up with signUpEmail
  // would fail with USER_ALREADY_EXISTS, so finish the job for the existing
  // session instead of attempting to create a new account.
  const existingUser = await getCurrentUser();
  if (existingUser) {
    const existingStore = await getCurrentStore();
    if (existingStore) {
      return { ok: false, error: t(d, "errors.signup.alreadyHaveStore") };
    }
    return createStoreFor(existingUser.id, storeName);
  }

  let userId: string;
  try {
    const result = await auth.api.signUpEmail({ body: { email, password, name: storeName } });
    userId = result.user.id;
  } catch (error) {
    return { ok: false, error: mapSignUpError(error) };
  }

  return createStoreFor(userId, storeName);
}

async function createStoreFor(ownerId: string, storeName: string): Promise<SignupResult> {
  try {
    const slug = await uniqueStoreSlug(storeName, (slug) =>
      prisma.store.findUnique({ where: { slug } }).then(Boolean)
    );

    await prisma.store.create({
      data: { slug, name: storeName, ownerId },
    });

    return { ok: true };
  } catch {
    // The account may already exist (signUpEmail succeeded and set the
    // session cookie) even though store creation just failed — don't throw,
    // or the user is left an authenticated, store-less orphan with no way
    // to recover from the form. They can retry; the recovery branch above
    // will pick their existing session back up and finish store creation.
    return { ok: false, error: t(d, "errors.signup.storeCreationFailed") };
  }
}

function mapSignUpError(error: unknown): string {
  const message =
    error instanceof Error
      ? (error as { body?: { message?: string } }).body?.message ?? error.message
      : "";
  if (message.includes("USER_ALREADY_EXISTS")) {
    return t(d, "errors.signup.emailTaken");
  }
  return t(d, "errors.signup.accountCreationFailed");
}
