# Per-store Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each store configure its own name, hero copy, footer text, logo image, and three brand colors, rendered on its storefront with neutral fallbacks so a new store isn't book-branded.

**Architecture:** Add 7 nullable columns to `Store`. The storefront reads them from the already-loaded `ctx.store` and applies colors via a wrapper element that overrides CSS custom properties. A Settings card edits them through a validated `updateBranding` server action. A one-off script backfills the existing book store so its storefront stays identical.

**Tech Stack:** Next.js (App Router, RSC), Prisma (PostgreSQL), Tailwind v4 (`@theme inline` CSS vars), Vitest, Vercel Blob (logo upload).

## Global Constraints

- All new `Store` columns are **nullable** — additive migration only, safe on prod.
- Colors stored as `#rrggbb` hex strings; invalid or empty → stored as `null` (fall back to default).
- Neutral colors (paper/ink/muted/border) stay fixed — only `brand`/`accent`/`gold` are themeable.
- Admin dashboard keeps the default palette; theming applies to storefront routes only.
- UI copy is Arabic; match the existing tone (e.g. feminine imperative "اكتبي", "اختاري").
- Server actions resolve the store via `requireStore()` and never trust a store id from the client.
- Existing test style: Vitest with `vi.hoisted()` + `vi.mock()`; action tests mock `@/lib/store-context` and `@/lib/prisma`.

---

### Task 1: Add branding columns to the Store schema

**Files:**
- Modify: `prisma/schema.prisma` (the `model Store` block)
- Generated: `prisma/migrations/<timestamp>_add_store_branding/migration.sql`

**Interfaces:**
- Produces: `Store.heroTitle`, `Store.heroSubtitle`, `Store.footerText`, `Store.logoUrl`, `Store.brandColor`, `Store.accentColor`, `Store.goldColor` — all `string | null` on the generated Prisma type.

- [ ] **Step 1: Add the columns to `model Store`**

In `prisma/schema.prisma`, inside `model Store`, add after the `itemNounPlural` line:

```prisma
  heroTitle        String?
  heroSubtitle     String?         @db.Text
  footerText       String?         @db.Text
  logoUrl          String?
  brandColor       String?
  accentColor      String?
  goldColor        String?
```

- [ ] **Step 2: Generate the migration + client**

Run (requires `POSTGRES_PRISMA_URL` / dev DB env set — this is the Neon dev DB):
`npx prisma migrate dev --name add_store_branding`
Expected: a new migration folder is created, `ALTER TABLE "Store" ADD COLUMN ...` for all 7 columns, and `prisma generate` runs.

- [ ] **Step 3: Verify the client types**

Run: `npx tsc --noEmit`
Expected: PASS (the new optional fields exist on the `Store` type).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(branding): add nullable branding columns to Store"
```

---

### Task 2: `isHexColor` validation helper

**Files:**
- Create: `src/lib/hex-color.ts`
- Test: `src/lib/__tests__/hex-color.test.ts`

**Interfaces:**
- Produces: `export function isHexColor(value: string): boolean` — true only for `#rrggbb` (6 hex digits, leading `#`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { isHexColor } from "@/lib/hex-color";

describe("isHexColor", () => {
  it("accepts #rrggbb", () => {
    expect(isHexColor("#b5542c")).toBe(true);
    expect(isHexColor("#FFFFFF")).toBe(true);
  });
  it("rejects malformed values", () => {
    expect(isHexColor("b5542c")).toBe(false);   // no #
    expect(isHexColor("#fff")).toBe(false);       // shorthand
    expect(isHexColor("#b5542cff")).toBe(false);  // 8 digits
    expect(isHexColor("#zzzzzz")).toBe(false);    // non-hex
    expect(isHexColor("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/hex-color.test.ts`
Expected: FAIL with "isHexColor is not a function" / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
/** True only for a full `#rrggbb` hex color (leading #, exactly 6 hex digits). */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/hex-color.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hex-color.ts src/lib/__tests__/hex-color.test.ts
git commit -m "feat(branding): add isHexColor helper"
```

---

### Task 3: `updateBranding` server action

**Files:**
- Modify: `src/actions/store.ts` (append a new action)
- Test: `src/actions/__tests__/update-branding.test.ts`

**Interfaces:**
- Consumes: `requireStore()` from `@/lib/store-context`; `isHexColor` from `@/lib/hex-color`; `prisma.store.update`.
- Produces:
  ```ts
  export type BrandingInput = {
    name: string;
    heroTitle: string;
    heroSubtitle: string;
    footerText: string;
    logoUrl: string;
    brandColor: string;
    accentColor: string;
    goldColor: string;
  };
  export async function updateBranding(
    input: BrandingInput
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  ```
  Empty text/logo strings are stored as `null`. Each color: valid hex → stored; empty → `null`; invalid non-empty → `{ ok:false }`. `name` is required (non-empty after trim).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireStore, storeUpdate } = vi.hoisted(() => ({
  requireStore: vi.fn(),
  storeUpdate: vi.fn(),
}));
vi.mock("@/lib/store-context", () => ({ requireStore }));
vi.mock("@/lib/prisma", () => ({ prisma: { store: { update: storeUpdate } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateBranding } from "@/actions/store";

const base = {
  name: "متجر مكياج",
  heroTitle: "",
  heroSubtitle: "",
  footerText: "",
  logoUrl: "",
  brandColor: "#aa3366",
  accentColor: "",
  goldColor: "",
};

beforeEach(() => {
  requireStore.mockReset();
  storeUpdate.mockReset();
  requireStore.mockResolvedValue({ id: "store-1", slug: "make-up" });
  storeUpdate.mockResolvedValue({});
});

describe("updateBranding", () => {
  it("stores trimmed values and nulls empty strings, scoped to the caller's store", async () => {
    const r = await updateBranding({ ...base, heroSubtitle: "  مرحبا  " });
    expect(r).toEqual({ ok: true });
    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: "store-1" },
      data: {
        name: "متجر مكياج",
        heroTitle: null,
        heroSubtitle: "مرحبا",
        footerText: null,
        logoUrl: null,
        brandColor: "#aa3366",
        accentColor: null,
        goldColor: null,
      },
    });
  });

  it("rejects an invalid non-empty color without writing", async () => {
    const r = await updateBranding({ ...base, accentColor: "blue" });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    const r = await updateBranding({ ...base, name: "   " });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/actions/__tests__/update-branding.test.ts`
Expected: FAIL with "updateBranding is not a function".

- [ ] **Step 3: Write minimal implementation**

Append to `src/actions/store.ts` (the file already has `"use server"`, `revalidatePath`, `prisma`, `requireStore` imported — add the `isHexColor` import at the top):

```ts
import { isHexColor } from "@/lib/hex-color";

export type BrandingInput = {
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
  goldColor: string;
};

// "" -> null; a non-empty value must be valid hex or the whole action fails.
function colorOrNull(value: string): string | null | false {
  const v = value.trim();
  if (!v) return null;
  return isHexColor(v) ? v : false;
}

export async function updateBranding(
  input: BrandingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await requireStore();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "الرجاء إدخال اسم المتجر" };

  const brandColor = colorOrNull(input.brandColor);
  const accentColor = colorOrNull(input.accentColor);
  const goldColor = colorOrNull(input.goldColor);
  if (brandColor === false || accentColor === false || goldColor === false) {
    return { ok: false, error: "أحد الألوان غير صالح" };
  }

  const orNull = (s: string) => (s.trim() ? s.trim() : null);

  await prisma.store.update({
    where: { id: store.id },
    data: {
      name,
      heroTitle: orNull(input.heroTitle),
      heroSubtitle: orNull(input.heroSubtitle),
      footerText: orNull(input.footerText),
      logoUrl: orNull(input.logoUrl),
      brandColor,
      accentColor,
      goldColor,
    },
  });

  revalidatePath("/");
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/actions/__tests__/update-branding.test.ts`
Expected: PASS (all 3 cases).

- [ ] **Step 5: Commit**

```bash
git add src/actions/store.ts src/actions/__tests__/update-branding.test.ts
git commit -m "feat(branding): updateBranding action with color validation"
```

---

### Task 4: Auto-derive the hover shade from the brand color

**Files:**
- Modify: `src/app/globals.css:7`

**Interfaces:**
- Produces: `--brand-dark` becomes a function of `--brand`, so overriding `--brand` per-store also updates hover states — no separate picker needed.

- [ ] **Step 1: Replace the fixed brand-dark value**

Change line 7 from:

```css
  --brand-dark: #8a3d1f;
```

to:

```css
  --brand-dark: color-mix(in srgb, var(--brand) 82%, #000);
```

- [ ] **Step 2: Verify the dev server still compiles**

Run: `npx tsc --noEmit`
Expected: PASS (CSS isn't typechecked, but confirms nothing else broke).

Manual check: load any admin page in the browser preview; hover a brand button (e.g. a `hover:bg-brand-dark` button) and confirm it still darkens.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(branding): derive --brand-dark from --brand via color-mix"
```

---

### Task 5: Storefront shell reads branding (header, footer, layout, metadata)

**Files:**
- Modify: `src/components/storefront/SiteHeader.tsx`
- Modify: `src/components/storefront/SiteFooter.tsx`
- Modify: `src/app/[storeSlug]/layout.tsx`

**Interfaces:**
- Consumes: `ctx.store` (with the new branding fields) from `resolveStorefrontContext`.
- Produces:
  - `SiteHeader({ basePath, name, logoUrl }: { basePath: string; name: string; logoUrl: string | null })`
  - `SiteFooter({ footerText }: { footerText: string | null })`

- [ ] **Step 1: Update `SiteHeader` to use name + logo**

Replace the body of `src/components/storefront/SiteHeader.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { storeHref } from "@/lib/store-href";
import { CartIcon } from "./CartIcon";

export function SiteHeader({
  basePath,
  name,
  logoUrl,
}: {
  basePath: string;
  name: string;
  logoUrl: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href={storeHref(basePath, "/")} className="flex items-center gap-2 text-brand">
          {logoUrl ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image src={logoUrl} alt={name} fill sizes="32px" className="object-contain" />
            </span>
          ) : (
            <ShoppingBag className="h-7 w-7" strokeWidth={2.5} />
          )}
          <span className="text-lg font-extrabold sm:text-xl">{name}</span>
        </Link>
        <CartIcon basePath={basePath} />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update `SiteFooter` to render footerText lines**

Replace `src/components/storefront/SiteFooter.tsx`:

```tsx
export function SiteFooter({ footerText }: { footerText: string | null }) {
  if (!footerText) return null;
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted sm:px-6">
        {footerText.split("\n").map((line, i) => (
          <p key={i} className={i === 0 ? undefined : "mt-1"}>
            {line}
          </p>
        ))}
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update the layout — color wrapper, props, metadata**

Replace `src/app/[storeSlug]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) return {};
  return {
    title: ctx.store.name,
    ...(ctx.store.heroSubtitle ? { description: ctx.store.heroSubtitle } : {}),
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const { store } = ctx;

  const brandStyle = {
    ...(store.brandColor ? { "--brand": store.brandColor } : {}),
    ...(store.accentColor ? { "--accent": store.accentColor } : {}),
    ...(store.goldColor ? { "--gold": store.goldColor } : {}),
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="flex min-h-full flex-col">
      <SiteHeader basePath={ctx.basePath} name={store.name} logoUrl={store.logoUrl} />
      <main className="flex-1">{children}</main>
      <SiteFooter footerText={store.footerText} />
    </div>
  );
}
```

- [ ] **Step 4: Verify types + render**

Run: `npx tsc --noEmit`
Expected: PASS.

Manual (browser preview, DB-connected checkout): visit a store URL; header shows the store name + neutral bag icon (or logo if set); footer shows footerText or is absent; if the store has `brandColor`, brand-colored elements reflect it.

- [ ] **Step 5: Commit**

```bash
git add src/components/storefront/SiteHeader.tsx src/components/storefront/SiteFooter.tsx "src/app/[storeSlug]/layout.tsx"
git commit -m "feat(branding): storefront shell reads name/logo/footer/colors from store"
```

---

### Task 6: Home hero reads title + subtitle from the store

**Files:**
- Modify: `src/app/[storeSlug]/page.tsx:29-38`

**Interfaces:**
- Consumes: `ctx.store.heroTitle`, `ctx.store.heroSubtitle`, `ctx.store.name`.

- [ ] **Step 1: Replace the hero `<section>`**

Change the hero section (currently lines 29–38) to:

```tsx
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
          {ctx.store.heroTitle ?? ctx.store.name}
        </h1>
        {ctx.store.heroSubtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-muted">{ctx.store.heroSubtitle}</p>
        )}
      </section>
```

(The `{ plural }` interpolation is dropped from the hero — the subtitle is now free-form stored text. `plural` is still used by the sections below, so keep the `storeNoun` line.)

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: PASS.

Manual: a store with no `heroSubtitle` shows just the title; with one, shows the paragraph.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[storeSlug]/page.tsx"
git commit -m "feat(branding): home hero title/subtitle from store"
```

---

### Task 7: Branding editor card in Settings

**Files:**
- Create: `src/components/admin/BrandingCard.tsx`
- Modify: `src/app/admin/(dashboard)/settings/page.tsx`

**Interfaces:**
- Consumes: `updateBranding`, `BrandingInput` from `@/actions/store`; the blob `upload` flow (`@vercel/blob/client` → `/api/admin/upload`) as used in `NewBookForm`.
- Produces: `BrandingCard({ initial }: { initial: BrandingInput })` — a client component.

- [ ] **Step 1: Create `BrandingCard`**

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { updateBranding, type BrandingInput } from "@/actions/store";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-ink">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#b5542c"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-white"
        />
        <input
          dir="ltr"
          value={value}
          placeholder="#b5542c"
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </div>
    </div>
  );
}

export function BrandingCard({ initial }: { initial: BrandingInput }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BrandingInput>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof BrandingInput>(key: K, value: BrandingInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      set("logoUrl", blob.url);
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message || "فشل رفع الشعار" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const r = await updateBranding(form);
    setSaving(false);
    if (r.ok) {
      setMsg({ ok: true, text: "تم حفظ الهوية" });
      router.refresh();
    } else {
      setMsg({ ok: false, text: r.error });
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">الهوية والتصميم</h2>
        <p className="mt-1 text-sm text-muted">اسم متجرك وألوانه وشعاره كما تظهر لعملائك.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-ink">الشعار</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files)} />
        <div className="flex items-center gap-4">
          {form.logoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-paper">
              <Image src={form.logoUrl} alt="" fill sizes="64px" className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted">
              لا يوجد
            </div>
          )}
          <Button type="button" variant="ghost" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> جارِ الرفع...</>) : (<><Upload className="h-4 w-4" /> {form.logoUrl ? "تغيير الشعار" : "رفع الشعار"}</>)}
          </Button>
          {form.logoUrl && (
            <button type="button" onClick={() => set("logoUrl", "")} className="text-sm font-bold text-muted hover:text-ink">
              إزالة
            </button>
          )}
        </div>
      </div>

      <Input id="brandName" label="اسم المتجر" value={form.name} onChange={(e) => set("name", e.target.value)} />
      <Input id="brandHeroTitle" label="عنوان الصفحة الرئيسية (اختياري)" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
      <Textarea id="brandHeroSubtitle" label="وصف قصير تحت العنوان (اختياري)" rows={3} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
      <Textarea id="brandFooter" label="نص التذييل (اختياري)" rows={2} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ColorField label="اللون الأساسي" value={form.brandColor} onChange={(v) => set("brandColor", v)} />
        <ColorField label="اللون الثانوي" value={form.accentColor} onChange={(v) => set("accentColor", v)} />
        <ColorField label="اللون الذهبي" value={form.goldColor} onChange={(v) => set("goldColor", v)} />
      </div>

      {msg && <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>{msg.text}</p>}

      <Button type="submit" disabled={saving || uploading} className="self-start">
        {saving ? "جارِ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Render it on the Settings page**

In `src/app/admin/(dashboard)/settings/page.tsx`, add the import and render the card (e.g. right after `StorefrontLinkCard`). Build `initial` from `store`, converting nulls to empty strings:

```tsx
import { BrandingCard } from "@/components/admin/BrandingCard";
```

```tsx
      <BrandingCard
        initial={{
          name: store.name,
          heroTitle: store.heroTitle ?? "",
          heroSubtitle: store.heroSubtitle ?? "",
          footerText: store.footerText ?? "",
          logoUrl: store.logoUrl ?? "",
          brandColor: store.brandColor ?? "",
          accentColor: store.accentColor ?? "",
          goldColor: store.goldColor ?? "",
        }}
      />
```

- [ ] **Step 3: Verify types + render**

Run: `npx tsc --noEmit`
Expected: PASS.

Manual (temporary preview route pattern, or DB-connected `/admin/settings`): the card shows all fields; changing a color via the swatch updates the hex box; Save shows "تم حفظ الهوية".

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/BrandingCard.tsx "src/app/admin/(dashboard)/settings/page.tsx"
git commit -m "feat(branding): branding editor card in settings"
```

---

### Task 8: Backfill script to preserve the book store

**Files:**
- Create: `scripts/backfill-branding.ts`

**Interfaces:**
- Consumes: `prisma` (via the same import scripts like `scripts/adopt-store.ts` use); a store slug passed as `process.argv[2]`.

- [ ] **Step 1: Inspect the existing script pattern**

Read `scripts/adopt-store.ts` to match its prisma import, argv handling, and exit/`$disconnect` conventions. Mirror them exactly.

- [ ] **Step 2: Write the script**

```ts
// Usage: npx tsx scripts/backfill-branding.ts <store-slug>
// Sets the original book store's branding to its previously-hardcoded values so
// its storefront is unchanged after per-store branding ships. Idempotent.
import { prisma } from "@/lib/prisma";

const NAME = "جذور عربية، أجنحة عالمية";
const HERO_SUBTITLE =
  "سلسلة كتب أطفال ثنائية اللغة (عربي-إنجليزي)، تروي قصص شخصيات عربية ألهمت العالم. أضيفي الكتب إلى سلتك واملئي بياناتك، وسنتواصل معك هاتفياً لتنسيق التوصيل والدفع.";
const FOOTER_TEXT =
  "جذور عربية، أجنحة عالمية — سلسلة كتب أطفال ثنائية اللغة\nنتواصل معك هاتفياً بعد إتمام الطلب لتنسيق التوصيل والدفع";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/backfill-branding.ts <store-slug>");
    process.exit(1);
  }
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    console.error(`No store with slug "${slug}"`);
    process.exit(1);
  }
  await prisma.store.update({
    where: { id: store.id },
    data: {
      name: NAME,
      heroSubtitle: HERO_SUBTITLE,
      footerText: FOOTER_TEXT,
      // heroTitle/logo/colors left as-is (null): heroTitle falls back to name,
      // colors fall back to the defaults that already match.
    },
  });
  console.log(`Backfilled branding for "${slug}".`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

(Adjust the prisma import and disconnect boilerplate to match `scripts/adopt-store.ts` if it differs.)

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: PASS. (Do not run it against a DB here; it runs once against prod during rollout.)

- [ ] **Step 4: Commit**

```bash
git add scripts/backfill-branding.ts
git commit -m "feat(branding): backfill script to preserve the book store"
```

---

## Rollout (post-implementation, run by the operator)

1. Deploy the migration (Task 1) to prod.
2. `npx tsx scripts/backfill-branding.ts <bookstore-slug>` against prod.
3. Deploy the storefront + admin changes (Tasks 4–7).

Order matters: the backfill must run before the storefront stops using hardcoded strings, or the book store briefly shows fallbacks.

## Self-Review

- **Spec coverage:** data model (T1), storefront texts (T5/T6), logo (T5), colors + wrapper (T4/T5), metadata (T5), admin editor + updateBranding (T3/T7), backfill (T8), tests (T2/T3). All spec sections covered.
- **Type consistency:** `BrandingInput` defined in T3 is imported and used verbatim in T7; `updateBranding` signature matches; `SiteHeader`/`SiteFooter` prop shapes in T5 match their callers in the same task; `Store` fields from T1 are consumed as `string | null` everywhere.
- **Placeholders:** none — every code step is concrete.
- **Note:** color CSS-var override relies on Tailwind v4 `@theme inline` mapping `--color-brand: var(--brand)` (confirmed in `globals.css`), so overriding `--brand` on a wrapper cascades.
