# Per-store branding & theming — design

**Date:** 2026-08-10
**Status:** Approved (pending spec review)
**Branch:** `claude/new-bundle-flow-test-*`

## Problem

The platform is multi-tenant (`store.thatsmy.app/<slug>`), but every storefront renders
the original book store's identity, which is **hardcoded**:

- Name `"جذور عربية، أجنحة عالمية"` — in `SiteHeader`, `SiteFooter`, the home hero `<h1>`,
  and the root-layout `<title>`.
- Hero subtitle paragraph — in `src/app/[storeSlug]/page.tsx`.
- Footer tagline — in `SiteFooter`.
- Logo — a hardcoded `BookOpen` (book) icon.
- Colors — global CSS variables in `src/app/globals.css` `:root` (`--brand`, `--accent`,
  `--gold`, plus neutrals), shared by all stores.

A newly created store (e.g. `make-up`) therefore looks like a bilingual children's book
shop. Operators need to configure their own name, hero copy, footer, logo, and colors.

## Goals

- Store owners can configure, per store: **name**, **hero title**, **hero subtitle**,
  **footer text**, **logo image**, and **three brand colors** (primary/accent/gold).
- The storefront renders these from the store record, with neutral fallbacks so an
  unconfigured store looks generic (not book-branded).
- The existing book store's storefront stays visually identical after rollout.
- Admin (dashboard) UI stays on the default palette — theming applies to storefronts only.

## Non-goals

- Configuring neutral colors (background/text/border/muted) — kept fixed for design
  coherence.
- Multiple themes / font selection / custom CSS.
- A live preview inside the editor (fallbacks + save-then-view is enough for v1).

## Data model

Add **7 nullable columns** to `Store` (reuse the existing `name` column for the store
name — do not add a second name field):

| Column | Type | Fallback when null |
|---|---|---|
| `heroTitle` | `String?` | `store.name` |
| `heroSubtitle` | `String? @db.Text` | hidden (no paragraph) |
| `footerText` | `String? @db.Text` | hidden (no tagline line) |
| `logoUrl` | `String?` | neutral icon (`ShoppingBag`) + name |
| `brandColor` | `String?` | global default `#b5542c` |
| `accentColor` | `String?` | global default `#1f6f6b` |
| `goldColor` | `String?` | global default `#d9a441` |

All nullable → the Prisma migration is **additive only** (no data rewrite, no NOT NULL
backfill), which is safe to run against prod. Colors are stored as `#rrggbb` hex strings.

## Storefront rendering

`resolveStorefrontContext` already returns the full `store` object on every storefront
render, so no extra query is needed.

### Text

- `SiteHeader` gains `name` and `logoUrl` props (from `ctx.store`).
- `SiteFooter` gains `name` and `footerText` props; renders the footer line only when
  `footerText` is non-empty.
- Home hero (`[storeSlug]/page.tsx`) uses `store.heroTitle ?? store.name` for the `<h1>`
  and renders the subtitle `<p>` only when `store.heroSubtitle` is non-empty.

### Logo

`SiteHeader`: if `logoUrl` is set, render `<Image>` with it; otherwise render a neutral
`ShoppingBag` icon. The store name text stays in both cases. (Consequence: the book
store's header icon changes from `BookOpen` to the neutral icon until it uploads a logo —
an accepted trade so new stores are not book-branded. The backfill script does not set a
logo, so the book store shows the neutral icon post-rollout unless a logo is uploaded.)

### Colors

The storefront layout (`[storeSlug]/layout.tsx`) wraps header + main + footer in a single
element whose inline style sets the CSS custom properties:

```tsx
const brandStyle = {
  ...(store.brandColor ? { "--brand": store.brandColor } : {}),
  ...(store.accentColor ? { "--accent": store.accentColor } : {}),
  ...(store.goldColor ? { "--gold": store.goldColor } : {}),
} as React.CSSProperties;
// <div style={brandStyle}> … </div>
```

Because `globals.css` maps `--color-brand: var(--brand)` etc. via `@theme inline`,
overriding `--brand`/`--accent`/`--gold` on the wrapper cascades to every
`text-brand`/`bg-brand`/`text-accent`/… inside it. Undefined values are omitted so the
global default applies. The admin dashboard is outside this wrapper and keeps defaults.

**Hover shade:** change `--brand-dark` in `globals.css` from the fixed `#8a3d1f` to
`color-mix(in srgb, var(--brand) 82%, #000)` so it auto-derives from whatever `--brand`
a store sets. This avoids a 4th color picker. (Minor: the book store's hover shade shifts
from `#8a3d1f` to the computed value — visually negligible, hover state only.)

### Metadata

Add `generateMetadata` to `[storeSlug]/layout.tsx` returning `title: store.name` (and
description from `heroSubtitle` when present) so each storefront tab is correctly named.
The root-layout hardcoded metadata stays as the platform default for non-store routes.

## Admin editor

New **`BrandingCard`** client component on the Settings page, titled **"الهوية والتصميم"**,
with fields:

- **Logo** — upload via the existing cover-image blob flow (`upload(...)` →
  `/api/admin/upload`), same pattern as `NewBookForm`. Shows current logo with a
  replace/remove control.
- **Name** (`store.name`), **hero title**, **hero subtitle** (textarea), **footer text**
  (textarea).
- **Three colors** — native `<input type="color">` paired with a hex text input, for
  primary / accent / gold, each with a small swatch. Non-technical-friendly.

Saved by a new server action **`updateBranding`** in `src/actions/store.ts`:

- Validates hex colors (`/^#[0-9a-fA-F]{6}$/`) — reject invalid; empty → store null
  (revert to default).
- Trims text fields; empty string → null.
- Scopes the update to the caller's store via `requireStore()`.
- `revalidatePath("/")` and the store's storefront paths.

## Preserving the book store

A one-off script `scripts/backfill-branding.ts` (parameterized by store slug, mirroring
`scripts/adopt-store.ts`) sets the book store's fields to its current hardcoded strings:

- `name`: `"جذور عربية، أجنحة عالمية"` (only if not already set to this)
- `heroSubtitle`: the current home-page paragraph
- `footerText`: the current footer tagline
- `heroTitle`: left **null** — it falls back to `name`, which now equals the brand string,
  so the hero `<h1>` is unchanged.

Colors are left null (defaults already match). Logo left null (neutral icon). Run once
against prod after the migration deploys. New stores are unaffected (all fields null).

## Testing

- **Unit** (`src/actions/__tests__`): `updateBranding` — valid hex accepted, invalid hex
  rejected, empty strings → null, cross-store update blocked. A `isHexColor` helper unit
  test.
- **Typecheck**: `tsc --noEmit` clean.
- **Manual/visual**: with a store configured (colors + logo + texts), the storefront
  reflects them; an unconfigured store shows neutral fallbacks; the admin dashboard is
  unchanged.

## Rollout order

1. Prisma migration (additive nullable columns) → deploy.
2. `scripts/backfill-branding.ts <bookstore-slug>` against prod (preserve book store).
3. Ship storefront + admin changes.

Steps 1–2 before 3 ensure the book store's fields exist and are populated before the
storefront switches from hardcoded strings to store fields.

## Files touched

- `prisma/schema.prisma` (+ generated migration)
- `src/app/globals.css` (brand-dark → color-mix)
- `src/app/[storeSlug]/layout.tsx` (color wrapper, generateMetadata, pass branding props)
- `src/app/[storeSlug]/page.tsx` (hero from store)
- `src/components/storefront/SiteHeader.tsx`, `SiteFooter.tsx`
- `src/actions/store.ts` (`updateBranding`, `isHexColor`)
- `src/components/admin/BrandingCard.tsx` (new)
- `src/app/admin/(dashboard)/settings/page.tsx` (render BrandingCard)
- `scripts/backfill-branding.ts` (new)
- `src/actions/__tests__/update-branding.test.ts` (new)
