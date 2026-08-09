# Settings: Storefront Link, Editable Slug, Password Change — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three self-serve cards to the admin Settings page — a storefront-link display, an editable store slug, and an email-code-gated password change.

**Architecture:** Pure helpers (slug validation, URL building) are unit-tested; a scoped server action updates the slug; the custom-domain resolver is decoupled to resolve by host so slug edits are safe; the password change uses Better Auth's email-OTP plugin sending through Resend. UI is small client components rendered by the existing Settings server page.

**Tech Stack:** Next.js 16 (App Router, server actions), Prisma + Postgres, Better Auth 1.6 (`emailOTP` plugin), Resend, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-settings-storefront-slug-password-design.md`.
- All user-facing copy is **Arabic**, RTL.
- Reuse existing helpers: `slugify`/`isReservedSlug` (`src/lib/store-slug.ts`), `requireStore` (`src/lib/store-context.ts`), Resend (`src/lib/resend.ts`).
- Better Auth: the `nextCookies()` plugin MUST remain **last** in the plugins array.
- Password change requires **no current password** (email code only; recovery-capable).
- Slug must be validated: format via `slugify`, not reserved, unique across stores.
- Custom-domain stores resolve **by host** (`customDomain` field), never by the mutable slug.
- Follow existing client-component pattern (`"use client"` + `useState`/`useTransition`), see `src/components/admin/AutoStockToggle.tsx`.
- Commit after each task. Run the full suite with `npx vitest run`.

---

### Task 1: `validateStoreSlug` pure validator

**Files:**
- Modify: `src/lib/store-slug.ts`
- Test: `src/lib/__tests__/store-slug.test.ts`

**Interfaces:**
- Consumes: existing `slugify`, `isReservedSlug`.
- Produces: `validateStoreSlug(input: string): { ok: true; slug: string } | { ok: false; error: string }`

- [ ] **Step 1: Write the failing tests** — append to `src/lib/__tests__/store-slug.test.ts`:

```ts
import { validateStoreSlug } from "@/lib/store-slug";

describe("validateStoreSlug", () => {
  it("normalizes a valid name to a slug", () => {
    expect(validateStoreSlug("Jane's Crafts")).toEqual({ ok: true, slug: "janes-crafts" });
  });
  it("rejects input that is empty after slugify", () => {
    expect(validateStoreSlug("!!!")).toEqual({ ok: false, error: "العنوان غير صالح" });
  });
  it("rejects a reserved slug", () => {
    const r = validateStoreSlug("admin");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/store-slug.test.ts`
Expected: FAIL — `validateStoreSlug` is not exported.

- [ ] **Step 3: Implement** — append to `src/lib/store-slug.ts`:

```ts
export type SlugValidation =
  | { ok: true; slug: string }
  | { ok: false; error: string };

// Format + reserved-word validation for a store slug. Uniqueness is a DB
// concern and is checked in the action, not here.
export function validateStoreSlug(input: string): SlugValidation {
  const slug = slugify(input);
  if (!slug) return { ok: false, error: "العنوان غير صالح" };
  if (isReservedSlug(slug)) {
    return { ok: false, error: "هذا العنوان محجوز، اختاري عنواناً آخر" };
  }
  return { ok: true, slug };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/__tests__/store-slug.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store-slug.ts src/lib/__tests__/store-slug.test.ts
git commit -m "feat(store-slug): add validateStoreSlug (format + reserved)"
```

---

### Task 2: `updateStoreSlug` server action

**Files:**
- Create: `src/actions/store.ts`
- Test: `src/actions/__tests__/store.test.ts`

**Interfaces:**
- Consumes: `validateStoreSlug` (Task 1), `requireStore`, `prisma.store`.
- Produces: `updateStoreSlug(input: string): Promise<{ ok: true; slug: string } | { ok: false; error: string }>`

- [ ] **Step 1: Write the failing test** — `src/actions/__tests__/store.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireStore, storeFindUnique, storeUpdate } = vi.hoisted(() => ({
  requireStore: vi.fn(),
  storeFindUnique: vi.fn(),
  storeUpdate: vi.fn(),
}));
vi.mock("@/lib/store-context", () => ({ requireStore }));
vi.mock("@/lib/prisma", () => ({
  prisma: { store: { findUnique: storeFindUnique, update: storeUpdate } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateStoreSlug } from "@/actions/store";

beforeEach(() => {
  requireStore.mockReset();
  storeFindUnique.mockReset();
  storeUpdate.mockReset();
  requireStore.mockResolvedValue({ id: "s1", slug: "shaymas-books" });
  storeFindUnique.mockResolvedValue(null);
});

describe("updateStoreSlug", () => {
  it("updates to a valid, unused slug", async () => {
    const r = await updateStoreSlug("Shaymas Store");
    expect(r).toEqual({ ok: true, slug: "shaymas-store" });
    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { slug: "shaymas-store" },
    });
  });
  it("rejects a reserved slug without touching the DB", async () => {
    const r = await updateStoreSlug("admin");
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });
  it("rejects a slug already taken by another store", async () => {
    storeFindUnique.mockResolvedValue({ id: "other", slug: "taken" });
    const r = await updateStoreSlug("taken");
    expect(r).toEqual({ ok: false, error: "هذا العنوان مستخدم من متجر آخر" });
    expect(storeUpdate).not.toHaveBeenCalled();
  });
  it("is a no-op success when the slug is unchanged", async () => {
    const r = await updateStoreSlug("shaymas-books");
    expect(r).toEqual({ ok: true, slug: "shaymas-books" });
    expect(storeUpdate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/actions/__tests__/store.test.ts`
Expected: FAIL — `@/actions/store` does not exist.

- [ ] **Step 3: Implement** — `src/actions/store.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/actions/__tests__/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/actions/store.ts src/actions/__tests__/store.test.ts
git commit -m "feat(actions): updateStoreSlug with validation + uniqueness"
```

---

### Task 3: `store-url.ts` public-URL helper

**Files:**
- Create: `src/lib/store-url.ts`
- Test: `src/lib/__tests__/store-url.test.ts`

**Interfaces:**
- Produces:
  - `platformStoreUrl(slug: string): string`
  - `storefrontUrls(store: { slug: string; customDomain: string | null }): { platform: string; customDomain: string | null }`

- [ ] **Step 1: Write the failing test** — `src/lib/__tests__/store-url.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { platformStoreUrl, storefrontUrls } from "@/lib/store-url";

describe("store-url", () => {
  it("builds the platform URL from the default origin", () => {
    expect(platformStoreUrl("shaymas-books")).toBe("https://store.thatsmy.app/shaymas-books");
  });
  it("returns both platform and custom-domain URLs when a custom domain is set", () => {
    expect(storefrontUrls({ slug: "shaymas-books", customDomain: "arabstories.shayma.me" })).toEqual({
      platform: "https://store.thatsmy.app/shaymas-books",
      customDomain: "https://arabstories.shayma.me",
    });
  });
  it("returns null customDomain when the store has none", () => {
    expect(storefrontUrls({ slug: "janes-crafts", customDomain: null }).customDomain).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/store-url.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/lib/store-url.ts`:

```ts
// Public storefront URLs for a store. Used server-side (reads BETTER_AUTH_URL)
// and the resulting strings are passed to client components as props.
function platformOrigin(): string {
  return (process.env.BETTER_AUTH_URL || "https://store.thatsmy.app").replace(/\/$/, "");
}

export function platformStoreUrl(slug: string): string {
  return `${platformOrigin()}/${slug}`;
}

export function storefrontUrls(store: { slug: string; customDomain: string | null }): {
  platform: string;
  customDomain: string | null;
} {
  return {
    platform: platformStoreUrl(store.slug),
    customDomain: store.customDomain ? `https://${store.customDomain}` : null,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/__tests__/store-url.test.ts`
Expected: PASS. (Default origin holds because `BETTER_AUTH_URL` is unset in the test env.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/store-url.ts src/lib/__tests__/store-url.test.ts
git commit -m "feat(store-url): platform + custom-domain storefront URLs"
```

---

### Task 4: Resolve custom-domain stores by host (safety fix)

**Files:**
- Modify: `src/lib/storefront-context.ts`
- Test: `src/lib/__tests__/storefront-context.test.ts`

**Interfaces:**
- `resolveStorefrontContext` signature unchanged; behavior for custom-domain hosts now queries `where: { customDomain: <host> }`.

- [ ] **Step 1: Update the tests to the new behavior** — replace the two custom-domain cases and add a slug-change case in `src/lib/__tests__/storefront-context.test.ts`. The `describe("resolveStorefrontContext", ...)` block becomes:

```ts
describe("resolveStorefrontContext", () => {
  it("custom-domain host: resolves the store by host, basePath empty", async () => {
    findUnique.mockResolvedValue({ id: "s1", slug: "shaymas-books", customDomain: "arabstories.shayma.me" });
    const ctx = await resolveStorefrontContext({ slugParam: "anything", host: "arabstories.shayma.me" });
    expect(ctx).toEqual({
      store: { id: "s1", slug: "shaymas-books", customDomain: "arabstories.shayma.me" },
      basePath: "",
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { customDomain: "arabstories.shayma.me" } });
  });
  it("custom-domain host: still resolves after the store's slug changes", async () => {
    // slug is now "new-slug" but the host lookup does not depend on the slug
    findUnique.mockResolvedValue({ id: "s1", slug: "new-slug", customDomain: "arabstories.shayma.me" });
    const ctx = await resolveStorefrontContext({ slugParam: "shaymas-books", host: "arabstories.shayma.me" });
    expect(ctx?.store.slug).toBe("new-slug");
    expect(ctx?.basePath).toBe("");
    expect(findUnique).toHaveBeenCalledWith({ where: { customDomain: "arabstories.shayma.me" } });
  });
  it("custom-domain host: normalizes port and case", async () => {
    findUnique.mockResolvedValue({ id: "s1", slug: "shaymas-books", customDomain: "arabstories.shayma.me" });
    await resolveStorefrontContext({ slugParam: null, host: "ARABSTORIES.shayma.me:443" });
    expect(findUnique).toHaveBeenCalledWith({ where: { customDomain: "arabstories.shayma.me" } });
  });
  it("platform host: basePath is /{slug}, resolved by slug", async () => {
    findUnique.mockResolvedValue({ id: "s2", slug: "janes-crafts", customDomain: null });
    const ctx = await resolveStorefrontContext({ slugParam: "janes-crafts", host: "store.thatsmy.app" });
    expect(ctx).toEqual({
      store: { id: "s2", slug: "janes-crafts", customDomain: null },
      basePath: "/janes-crafts",
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: "janes-crafts" } });
  });
  it("returns null when the store slug does not exist", async () => {
    findUnique.mockResolvedValue(null);
    expect(await resolveStorefrontContext({ slugParam: "nope", host: "store.thatsmy.app" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/storefront-context.test.ts`
Expected: FAIL — current code queries by slug, not `customDomain`.

- [ ] **Step 3: Implement** — replace the body of `resolveStorefrontContextByKey` in `src/lib/storefront-context.ts`:

```ts
const resolveStorefrontContextByKey = cache(
  async (slugParam: string | null, host: string): Promise<{ store: Store; basePath: string } | null> => {
    // Custom-domain hosts resolve the store BY HOST (not by a slug in the static
    // map), so an operator can change their slug without breaking their domain.
    if (customDomainSlug(host)) {
      const cleanHost = host.toLowerCase().split(":")[0].trim();
      const store = await prisma.store.findUnique({ where: { customDomain: cleanHost } });
      if (!store) return null;
      return { store, basePath: "" };
    }
    // Platform host: resolve by the URL slug.
    if (!slugParam) return null;
    const store = await prisma.store.findUnique({ where: { slug: slugParam } });
    if (!store) return null;
    return { store, basePath: `/${store.slug}` };
  }
);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/__tests__/storefront-context.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storefront-context.ts src/lib/__tests__/storefront-context.test.ts
git commit -m "fix(storefront): resolve custom-domain stores by host, not slug"
```

---

### Task 5: Storefront-link + slug-editor cards in Settings

**Files:**
- Create: `src/components/admin/StorefrontLinkCard.tsx`
- Create: `src/components/admin/StoreSlugEditor.tsx`
- Modify: `src/app/admin/(dashboard)/settings/page.tsx`

**Interfaces:**
- Consumes: `storefrontUrls` (Task 3), `updateStoreSlug` (Task 2), `store.slug`/`store.customDomain`.
- `StorefrontLinkCard` props: `{ platform: string; customDomain: string | null }`
- `StoreSlugEditor` props: `{ slug: string; platform: string }`

- [ ] **Step 1: Implement `StorefrontLinkCard`** — `src/components/admin/StorefrontLinkCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

function LinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-paper p-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted">{label}</p>
        <p dir="ltr" className="truncate text-sm font-bold text-ink">{url}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label="نسخ الرابط"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg border border-border bg-white p-2 text-muted hover:text-ink"
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="فتح المتجر"
          className="rounded-lg border border-border bg-white p-2 text-muted hover:text-ink"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function StorefrontLinkCard({
  platform,
  customDomain,
}: {
  platform: string;
  customDomain: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">رابط متجرك</h2>
        <p className="mt-1 text-sm text-muted">شاركي هذا الرابط مع عملائك لزيارة متجرك.</p>
      </div>
      {customDomain && <LinkRow label="رابط متجرك (الأساسي)" url={customDomain} />}
      <LinkRow label="رابط المنصة" url={platform} />
    </div>
  );
}
```

- [ ] **Step 2: Implement `StoreSlugEditor`** — `src/components/admin/StoreSlugEditor.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSlug } from "@/actions/store";

export function StoreSlugEditor({ slug, platform }: { slug: string; platform: string }) {
  const router = useRouter();
  const origin = platform.slice(0, platform.length - slug.length); // e.g. "https://store.thatsmy.app/"
  const [value, setValue] = useState(slug);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await updateStoreSlug(value);
      if (r.ok) {
        setValue(r.slug);
        setMsg({ ok: true, text: "تم تحديث العنوان" });
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">عنوان المتجر</h2>
        <p className="mt-1 text-sm text-muted">
          تغيير العنوان يوقف عمل أي روابط قديمة على المنصة شاركتِها سابقاً. رابط النطاق المخصص لا يتأثر.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span dir="ltr" className="text-sm text-muted">{origin}</span>
        <input
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border px-3 py-1.5 text-sm font-bold"
        />
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : "حفظ"}
        </button>
      </div>
      {msg && (
        <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into the Settings page** — edit `src/app/admin/(dashboard)/settings/page.tsx` to import the helpers/components and render the cards above the existing AutoStock card:

```tsx
import { redirect } from "next/navigation";
import { getAutoStockEnabled } from "@/lib/settings";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { storefrontUrls } from "@/lib/store-url";
import { AutoStockToggle } from "@/components/admin/AutoStockToggle";
import { StorefrontLinkCard } from "@/components/admin/StorefrontLinkCard";
import { StoreSlugEditor } from "@/components/admin/StoreSlugEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { plural } = storeNoun(store);
  const autoStockEnabled = await getAutoStockEnabled(store.id);
  const urls = storefrontUrls(store);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">الإعدادات</h1>

      <StorefrontLinkCard platform={urls.platform} customDomain={urls.customDomain} />
      <StoreSlugEditor slug={store.slug} platform={urls.platform} />

      <div className="rounded-2xl border border-border bg-white p-5">
        <AutoStockToggle enabled={autoStockEnabled} itemNounPlural={plural} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build + types**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/StorefrontLinkCard.tsx src/components/admin/StoreSlugEditor.tsx "src/app/admin/(dashboard)/settings/page.tsx"
git commit -m "feat(settings): storefront link card + editable store slug"
```

---

### Task 6: Password-reset email + Better Auth email-OTP wiring

**Files:**
- Modify: `src/lib/resend.ts`
- Modify: `src/lib/auth-server.ts`
- Modify: `src/lib/auth-client.ts`
- Test: `src/lib/__tests__/resend-otp.test.ts`

**Interfaces:**
- Produces: `sendPasswordResetOtp(email: string, otp: string): Promise<void>`
- Produces (client): `authClient.emailOtp.sendVerificationOtp(...)`, `authClient.emailOtp.resetPassword(...)`

- [ ] **Step 1: Write the failing test** — `src/lib/__tests__/resend-otp.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send } })) }));

beforeEach(() => {
  send.mockReset();
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_FROM_EMAIL", "store@example.com");
});

describe("sendPasswordResetOtp", () => {
  it("sends the OTP to the given email with the code in the body", async () => {
    const { sendPasswordResetOtp } = await import("@/lib/resend");
    await sendPasswordResetOtp("owner@example.com", "123456");
    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe("owner@example.com");
    expect(arg.from).toBe("store@example.com");
    expect(arg.html).toContain("123456");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/__tests__/resend-otp.test.ts`
Expected: FAIL — `sendPasswordResetOtp` not exported.

- [ ] **Step 3a: Implement the sender** — append to `src/lib/resend.ts`:

```ts
export async function sendPasswordResetOtp(email: string, otp: string): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset OTP email");
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: "رمز تغيير كلمة المرور",
      html: `
        <div dir="rtl" style="font-family:sans-serif">
          <h2>رمز تغيير كلمة المرور</h2>
          <p>استخدمي هذا الرمز لتعيين كلمة مرور جديدة:</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:4px">${otp}</p>
          <p style="color:#666">ينتهي الرمز خلال بضع دقائق. إن لم تطلبي هذا التغيير، تجاهلي هذه الرسالة.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset OTP email", err);
  }
}
```

- [ ] **Step 3b: Wire the server plugin** — edit `src/lib/auth-server.ts`:

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtp } from "@/lib/resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [
    // Emails a one-time code; used by the Settings password-change flow
    // (type "forget-password") and doubles as account recovery.
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendPasswordResetOtp(email, otp);
      },
    }),
    nextCookies(), // MUST stay last
  ],
});
```

- [ ] **Step 3c: Wire the client plugin** — edit `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({ plugins: [emailOTPClient()] });

export const { signIn, signOut, useSession } = authClient;
```

- [ ] **Step 4: Verify** — first confirm the client method names exist in the installed version:

Run: `grep -rE "sendVerificationOtp|resetPassword" node_modules/better-auth/dist/client/plugins/index.d.ts | head`
Expected: both names appear (they are the email-OTP client methods used in Task 7). If the reset method is named differently, note it for Task 7.

Run: `npx vitest run src/lib/__tests__/resend-otp.test.ts && npx tsc --noEmit`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/resend.ts src/lib/auth-server.ts src/lib/auth-client.ts src/lib/__tests__/resend-otp.test.ts
git commit -m "feat(auth): email-OTP plugin + password reset OTP email"
```

---

### Task 7: Change-password card in Settings

**Files:**
- Create: `src/components/admin/ChangePasswordCard.tsx`
- Modify: `src/app/admin/(dashboard)/settings/page.tsx`

**Interfaces:**
- Consumes: `authClient.emailOtp.sendVerificationOtp`, `authClient.emailOtp.resetPassword` (Task 6); `getCurrentUser().email`.
- `ChangePasswordCard` props: `{ email: string }`

- [ ] **Step 1: Implement `ChangePasswordCard`** — `src/components/admin/ChangePasswordCard.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordCard({ email }: { email: string }) {
  const [stage, setStage] = useState<"idle" | "code">("idle");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function sendCode() {
    setMsg(null);
    startTransition(async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      if (error) {
        setMsg({ ok: false, text: "تعذّر إرسال الرمز، حاولي مرة أخرى" });
        return;
      }
      setStage("code");
      setMsg({ ok: true, text: `أرسلنا رمزاً إلى ${email}` });
    });
  }

  function submitNewPassword() {
    setMsg(null);
    if (password.length < 8) {
      setMsg({ ok: false, text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      return;
    }
    if (password !== confirm) {
      setMsg({ ok: false, text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
      if (error) {
        setMsg({ ok: false, text: "الرمز غير صحيح أو منتهي، حاولي مرة أخرى" });
        return;
      }
      setStage("idle");
      setOtp(""); setPassword(""); setConfirm("");
      setMsg({ ok: true, text: "تم تغيير كلمة المرور بنجاح" });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">كلمة المرور</h2>
        <p className="mt-1 text-sm text-muted">
          لتغيير كلمة المرور، سنرسل رمزاً إلى بريدك ({email}) للتأكد من هويتك.
        </p>
      </div>

      {stage === "idle" ? (
        <button
          type="button"
          disabled={pending}
          onClick={sendCode}
          className="self-start rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : "تغيير كلمة المرور"}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            dir="ltr" inputMode="numeric" placeholder="الرمز المكوّن من 6 أرقام"
            value={otp} onChange={(e) => setOtp(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold"
          />
          <input
            type="password" placeholder="كلمة المرور الجديدة"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <input
            type="password" placeholder="تأكيد كلمة المرور"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button" disabled={pending} onClick={submitNewPassword}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {pending ? "..." : "حفظ كلمة المرور"}
            </button>
            <button
              type="button" disabled={pending} onClick={sendCode}
              className="text-xs font-bold text-muted hover:text-ink"
            >
              إعادة إرسال الرمز
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
```

> If Task 6 Step 4 found the reset method is named differently (e.g. not `resetPassword`), use that exact name here.

- [ ] **Step 2: Wire into the Settings page** — add the import and render below the slug editor. In `src/app/admin/(dashboard)/settings/page.tsx`:
  - add `import { getCurrentUser } from "@/lib/auth-guard";`
  - add `import { ChangePasswordCard } from "@/components/admin/ChangePasswordCard";`
  - after resolving `store`, add: `const user = await getCurrentUser();`
  - render after `<StoreSlugEditor .../>`: `{user && <ChangePasswordCard email={user.email} />}`

- [ ] **Step 3: Verify build + types**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ChangePasswordCard.tsx "src/app/admin/(dashboard)/settings/page.tsx"
git commit -m "feat(settings): change password via emailed code"
```

---

### Task 8: Ship — build, deploy, verify

**Files:** none (release task)

- [ ] **Step 1: Full suite + typecheck**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass.

- [ ] **Step 2: Merge to main**

```bash
cd /Users/balanceshayma/Documents/GitHub/argw
git checkout main && git merge --ff-only claude/wording-and-money
```

- [ ] **Step 3: Deploy (build on Vercel — never a local prebuild)**

Run: `vercel --prod`
Expected: `Build Completed`, deployment `READY`.

- [ ] **Step 4: Verify unauthenticated health**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://store.thatsmy.app/admin/settings"   # 307 -> login
curl -s -o /dev/null -w "%{http_code}\n" "https://arabstories.shayma.me/"              # 200 (custom domain intact)
curl -s -o /dev/null -w "%{http_code}\n" "https://store.thatsmy.app/shaymas-books"     # 200 (platform storefront)
```

- [ ] **Step 5: Ask the operator (signed in) to verify:** storefront links copy/open; changing the slug updates the platform link and old slug 404s while `arabstories.shayma.me` still loads; the password change emails a code and accepts a new password.

---

## Self-Review

**Spec coverage:**
- §3 Storefront link card → Task 5 (StorefrontLinkCard) + Task 3 (URLs). ✓
- §4.1/4.2 Slug UI + action → Task 5 (StoreSlugEditor) + Task 2 (updateStoreSlug) + Task 1 (validation). ✓
- §4.3 Custom-domain decoupling → Task 4. ✓
- §5.1 Auth wiring (plugin, resend, client) → Task 6. ✓
- §5.2 Password UI flow → Task 7. ✓
- §5.3 Security boundary → honored (no password handled by build; email-only). ✓
- §7 Testing focus → slug validation (T1/T2), resolver (T4), URLs (T3), OTP send (T6); password UI manual (T8). ✓

**Placeholder scan:** none — every code/test step carries real content.

**Type consistency:** `validateStoreSlug` returns `{ ok, slug|error }` used identically in T1→T2. `storefrontUrls` shape (`platform`, `customDomain`) matches T5 props. `authClient.emailOtp.*` used in T7 matches the plugin added in T6 (with a verification step for the exact reset method name).
