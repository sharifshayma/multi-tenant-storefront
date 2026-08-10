import { z } from "zod";

// zod issue `.message` values below are `errors.*` / `admin.*` dictionary
// KEYS, not translated text — these schemas have no store/locale context.
// Callers translate with `t()`: client components via `useT()`'s `t`
// (CartPageClient, LoginForm, SignupForm); server actions that haven't
// resolved a store yet (createOrder before store resolution, signup) fall
// back to `getDictionary("ar")` — see recipe/brief for rationale.
export const checkoutSchema = z.object({
  storeSlug: z.string().trim().min(1, "errors.checkout.storeUnavailable"),
  customerName: z.string().trim().min(2, "errors.checkout.nameRequired"),
  phone: z
    .string()
    .trim()
    .min(9, "errors.validation.invalidPhone")
    .regex(/^[0-9+\-\s]+$/, "errors.validation.invalidPhone"),
  email: z
    .union([z.string().trim().email("errors.validation.invalidEmail"), z.literal("")])
    .optional(),
  city: z.string().trim().min(2, "errors.checkout.cityRequired"),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        bookId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .default([]),
  collections: z
    .array(
      z.object({
        collectionId: z.string(),
        quantity: z.number().int().min(1),
        selectedBookIds: z.array(z.string()).min(1),
      })
    )
    .default([]),
}).refine((data) => data.items.length > 0 || data.collections.length > 0, {
  message: "errors.checkout.emptyCart",
  path: ["items"],
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().email("errors.validation.invalidEmail"),
  password: z.string().min(1, "errors.validation.passwordRequired"),
});

export const signupSchema = z.object({
  email: z.string().trim().email("errors.validation.invalidEmail"),
  // Same copy as admin.settings.password.tooShort (dashboard password change) — reused.
  password: z.string().min(8, "admin.settings.password.tooShort"),
  // Same copy as errors.store.nameRequired (branding form) — reused.
  storeName: z.string().trim().min(1, "errors.store.nameRequired"),
});

export type SignupInput = z.infer<typeof signupSchema>;
