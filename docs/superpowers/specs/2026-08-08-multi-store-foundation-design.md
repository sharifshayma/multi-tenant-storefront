# Multi-Store Foundation — Design Spec

**Date:** 2026-08-08
**Status:** Approved (design) — pending spec review before implementation plan
**Scope:** Sub-project ① of the "turn argw into a multi-store platform" effort

---

## 1. Background & Goal

`argw` today is a **single-store, single-owner, books-only** app: a public
storefront (`src/app/(site)`) plus an admin dashboard (`src/app/admin`) backed by
Prisma + Vercel Postgres. It is hard-wired to one store (the owner's Arabic
bookstore, "Arab Roots, Global Wings").

**Goal:** turn it into a **hosted multi-tenant SaaS** where anyone can run their
own store — track orders, finances, and stock, and take cash-on-delivery orders
through their own public storefront — while the owner keeps running their
bookstore on it as tenant #1.

This spec covers **only the foundation** (accounts + tenant isolation + routing +
product generalization + migrating the existing store). Onboarding, i18n, and
branding are separate later sub-projects (§10).

## 2. Locked Decisions

These were decided during brainstorming and are fixed for this spec:

| # | Decision | Choice |
|---|----------|--------|
| 1 | Tenancy model | **Hosted multi-tenant SaaS** (owner operates one deployment) |
| 2 | Product model | **Generic products** — `Book`→`Product`, `Collection`→`Bundle` |
| 3 | Order intake | **Public storefront per store** (customer places cash-on-delivery orders) |
| 4 | Store URLs | **Path-based** `platform.com/{storeSlug}` + optional per-store custom domain |
| 5 | Language | Per-store **Arabic (RTL) + English (LTR)** — *structural placeholders only in this spec; full i18n is sub-project ③* |
| 6 | Data isolation | **Level 1 (app-level tenant gate) now**; Postgres RLS deferred |
| 7 | Auth | **Self-hosted library** (Auth.js or Better Auth), email + password, sessions in Postgres — no per-MAU fees |

## 3. Strategy

**Foundation-first, keep the store live throughout (Strategy A).** We extend the
existing (clean) codebase rather than rewrite. The existing bookstore is migrated
in as tenant #1 and its custom domain keeps resolving to it, so it never goes
dark during the transition.

## 4. Data Model Changes

### 4.1 New models

- **`User`** — `id`, `email` (unique), `passwordHash`, `name?`, timestamps.
  Plus whatever session/account tables the chosen auth library requires.
- **`Store`** — `id`, `slug` (globally unique, the `/url-name`), `name`,
  `currency` (ISO 4217, e.g. `ILS`), `defaultLocale` (`ar` | `en`),
  `customDomain?` (nullable, **unique**), `ownerId` → `User`, timestamps.
  - v1 UI: **one user owns one store**. The `ownerId` FK already permits
    one→many later without a schema change; we simply don't build that UI yet.
- **`StoreSettings`** — replaces the current global `Setting` key/value table.
  Keyed by `(storeId, key)`. Holds `autoStockOnFulfillment`, order-notification
  email, and later branding.

### 4.2 Renamed models

- `Book` → **`Product`**; `BookMedia` → **`ProductMedia`**.
- `Collection` → **`Bundle`**; `CollectionBook` → **`BundleProduct`**;
  `OrderCollectionItem` → **`OrderBundleItem`**;
  `OrderCollectionItemBook` → **`OrderBundleItemProduct`**.

### 4.3 Tenant tagging

Add a non-null **`storeId`** FK to every aggregate root:
`Product`, `Bundle`, `Order`, `Transaction`, `StockMovement`, `StoreSettings`.
Child rows (`ProductMedia`, `OrderItem`, `BundleProduct`, `OrderBundleItem`, …)
are reached only through their parent and are scoped transitively; they do **not**
get their own `storeId` in v1 (keeps the schema simpler; the gate always enters
through a scoped root).

### 4.4 Uniqueness changes

- `Product.slug`, `Bundle.slug`: change from globally unique → **`@@unique([storeId, slug])`**.
  Two stores may both have a `coffee-mug`.
- `Store.slug` and `Store.customDomain`: globally unique.
- Reserved store slugs (cannot be registered): `admin`, `login`, `signup`,
  `api`, `_next`, plus a short denylist.

### 4.5 Money model

Today prices are whole shekels in `Int` fields named `*Nis`
(`priceNis`, `totalNis`, `discountNis`, `unitPriceNis`, `amountNis`).

Change to **integer minor units** (agorot/cents) named `*Minor`
(`priceMinor`, `totalMinor`, …), with the currency carried by the owning
`Store.currency`. Formatting/label logic (currently `₪` literals in
`src/lib/resend.ts` and components) moves to a currency-aware formatter.

## 5. Routing Design

Three page classes:

| Class | Paths | Store resolved from |
|-------|-------|---------------------|
| Platform | `/`, `/login`, `/signup` | none |
| Storefront (public) | `/{storeSlug}`, `/{storeSlug}/products/{slug}`, `/{storeSlug}/cart`, `/{storeSlug}/checkout`, `/{storeSlug}/order/confirmation` | URL slug (or custom domain, §6) |
| Admin (private) | `/admin`, `/admin/orders`, `/admin/products`, `/admin/bundles`, `/admin/finance`, `/admin/stock`, `/admin/settings` | logged-in user's session |

App Router structure:

- `src/app/(platform)/` — landing, `login`, `signup`.
- `src/app/[storeSlug]/` — the storefront (migrated from today's `(site)` group).
- `src/app/admin/` — owner dashboard (session-scoped; largely as today but
  store-aware).

Next resolves static segments before the dynamic `[storeSlug]`, so `/admin`,
`/login`, etc. never collide with a store — enforced by the reserved-slug list.

> **Next 16 note:** exact App Router + `proxy.ts` APIs (this repo already uses the
> Next 16 `proxy.ts` middleware rename, `src/proxy.ts`) must be confirmed against
> the installed Next 16 before code is written, per `AGENTS.md`. This is an
> implementation-plan gate, not a design change.

## 6. Custom Domain Handling (brought forward from sub-project ④)

Just enough to keep the owner's existing URL working from day one.

- `Store.customDomain` holds e.g. `arabstories.shayma.me`.
- `proxy.ts` inspects the request **Host** header first:
  - Host is a known `customDomain` → rewrite so `/` (and bare paths) serve that
    store's storefront; the slug is implied, never shown.
  - Host is the platform domain → use the `/{storeSlug}` path segment.
- The owner's domain is added to the new deployment. **A single named custom
  domain is allowed on Vercel's free tier** (only wildcard subdomains require
  Pro), so this does not add hosting cost.

## 7. Tenant Isolation (Level 1)

**Principle: nothing reaches the database without a `storeId`.**

1. **Resolve once per request** — admin: from session `userId` → their `Store`;
   storefront: from slug/custom domain. Yields exactly one `storeId`.
2. **Scoped data layer (the gate)** — replace direct `prisma.*` calls in
   `src/actions/*` and `src/lib/data.ts` with a store-scoped accessor that
   **auto-injects `storeId`** on every read, and stamps it on create; update/
   delete must verify the target row belongs to the store. Implemented as a thin
   tenant-aware wrapper (candidate: a Prisma Client Extension) so there is a
   single choke point.
3. **Result** — cross-store reads/writes are structurally impossible as long as
   all access goes through the gate. A lint/review rule discourages raw
   `prisma.*` in feature code.

**Deferred (Level 2):** Postgres row-level security as a database-enforced
backstop, added once there are real customers. Called out as future work, not
built now.

## 8. Auth Design

- Replace `ADMIN_PASSWORD` + `{ admin: true }` JWT (`src/lib/auth.ts`,
  `src/app/api/admin/login/route.ts`) with a self-hosted auth library
  (Auth.js/Better Auth), email + password, session rows in Postgres.
- Session carries `userId`. `proxy.ts` guards `/admin/*`: no valid session →
  redirect to `/login`.
- The "create your store" signup wizard is **sub-project ②**; the foundation only
  needs: accounts exist, a user can log in, and the owner account is seeded by the
  migration.

## 9. Migration of the Existing Store (one-time)

Idempotent script:

1. Create the owner `User` and their `Store` (`slug=shaymas-books`,
   `currency=ILS`, `defaultLocale=ar`, `customDomain=arabstories.shayma.me`).
2. Set `storeId` on every existing `Product`(Book), `Bundle`(Collection),
   `Order`, `Transaction`, `StockMovement`, and migrate the global `Setting`
   rows into that store's `StoreSettings`.
3. Convert money `*Nis` → `*Minor` (×100).

No data is recreated or deleted; the existing store is adopted as tenant #1.

## 10. Out of Scope (later sub-projects)

- **②** Owner onboarding: signup + "create your store" wizard + per-store settings UI.
- **③** Internationalization: extract hardcoded Arabic strings, per-store ar/en + RTL/LTR.
- **④** Per-store branding (logo/colors) and general custom-domain UX (self-serve).
- Multiple stores per user; team members/roles; online payments (cash-only stays).

## 11. Cost Guardrails

Public storefronts are the traffic class that previously blew the Vercel free
tier. Storefront pages must be **cache-first (static / ISR)** so browsing does not
generate per-request function invocations. Designed in from the start.

## 12. Testing Approach

- **Isolation tests (highest priority):** given two stores, assert that every
  scoped accessor and every admin/storefront path returns only the owning store's
  rows, and that update/delete cannot touch another store's row.
- **Migration test:** run the script against a seeded single-store DB; assert all
  rows adopted, money converted, settings moved, idempotent on re-run.
- **Routing tests:** slug resolution, reserved-slug rejection, custom-domain
  Host rewrite, unknown slug → 404, `/admin` requires session.
- **Auth tests:** login success/failure, session guard on `/admin`.

## 13. Risks / Open Items

- **Next 16 specifics** (App Router dynamic routes, `proxy.ts` rewrite API) —
  verify against installed docs/source before coding (`AGENTS.md`).
- **Auth library choice** (Auth.js vs Better Auth) — finalize at plan time based
  on Next 16 + Prisma adapter maturity.
- **Money migration** is destructive-in-place (×100); must be covered by the
  migration test and run against a backup first.
- Breadth of the `*Nis`→`*Minor` and `Book`→`Product` renames touches many files;
  the implementation plan should sequence renames to keep the app buildable.
