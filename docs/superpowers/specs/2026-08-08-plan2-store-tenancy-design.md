# Plan 2 — Store Foundation, Tenant Isolation & Minimal Signup

**Date:** 2026-08-08
**Status:** Approved (design) — pending spec review before implementation plan
**Parent design:** [multi-store foundation](2026-08-08-multi-store-foundation-design.md)
**Predecessor:** Plan 1 (Accounts) — merged to `main` at `20d4951`

---

## 1. Goal

Turn the single-tenant bookstore into a real multi-tenant app: introduce the
`Store` concept, isolate every store's data, and let a new person **sign up →
get their own store → land in their dashboard**. The existing bookstore is
migrated in as tenant #1 and keeps working throughout.

This is Plan 2 of 4. It builds directly on Plan 1's accounts (Better Auth,
`User`, `getCurrentUser`/`requireUser`, email/password login).

## 2. Locked Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope | Store foundation + tenant isolation + **minimal** signup/onboarding |
| 2 | Signup flow | **One combined form** — email + password + store name → creates account AND store → `/admin` |
| 3 | Isolation | Level 1 app-level tenant gate (as approved in the foundation spec) |
| 4 | Stores per user | One store per user in v1 (enforced in app; schema permits many later) |
| 5 | New stores' public storefront | **Deferred to Plan 4** (routing). Plan 2 gives a new owner a working admin only. |
| 6 | Money model | Unchanged (`priceNis`) — conversion to minor units is **Plan 3** |
| 7 | `Book`→`Product` rename | **Plan 3** — not in this plan |

## 3. Data Model Changes

### 3.1 New models
- **`Store`** — `id`, `slug` (globally unique), `name`, `currency` (default
  `"USD"`), `defaultLocale` (`"en"` | `"ar"`, default `"en"`), `customDomain?`
  (nullable, unique), `ownerId` → `User`, timestamps. `ownerId` is a plain FK
  (not unique) so one→many is possible later; one-store-per-user is enforced in
  the signup action for v1.
- **`StoreSettings`** — replaces the global `Setting` table. Composite key
  `(storeId, key)`, plus `value`. Holds `autoStockOnFulfillment` and future
  per-store settings.

### 3.2 Tenant tagging
Add a non-null **`storeId`** FK to the aggregate roots: `Book`, `Collection`,
`Order`, `Transaction`, `StockMovement`. Child rows (`BookMedia`, `OrderItem`,
`CollectionBook`, `OrderCollectionItem`, `OrderCollectionItemBook`) remain
scoped through their parent — the gate always enters via a scoped root.

### 3.3 Uniqueness
- `Book.slug`, `Collection.slug`: change from global unique → `@@unique([storeId, slug])`.
- `Store.slug`, `Store.customDomain`: globally unique.
- Reserved `Store.slug` values (rejected at signup): `admin`, `login`, `signup`,
  `api`, `_next`, plus a short denylist.

### 3.4 Not changed in this plan
Money fields stay `*Nis` (whole shekels) and `Book`/`Collection` keep their
names — both change in Plan 3. Adding `Store.currency` now is forward-looking
metadata; new stores have no products in Plan 2, so the `priceNis` naming does
not bite yet.

## 4. Tenant Gate (Isolation)

**Principle: no store's data is read or written without its `storeId`.**

- **`getCurrentStore()`** — resolves the caller's `Store` from the logged-in
  user's session (`getCurrentUser()` → `Store` by `ownerId`). Returns the store
  or null. Admin pages and actions get `storeId` from here.
- **Scoped data access** — refactor `src/lib/data.ts` and all 7
  `src/actions/*.ts` so:
  - every read filters by `storeId`,
  - every create stamps `storeId`,
  - every update/delete first verifies the target row belongs to the caller's
    store (else throws/404).
- **Admin dashboard pages** (`src/app/admin/(dashboard)/**`) resolve the store
  via `getCurrentStore()` and pass `storeId` into the data calls; a missing
  store redirects to signup/login.
- **Public storefront** (`src/app/(site)/**`) — for Plan 2 it continues to serve
  the owner's bookstore. Resolution: match the request host against
  `Store.customDomain`; if none matches, fall back to the single designated
  primary store (tenant #1). Full path-based multi-store routing is Plan 4.

## 5. Minimal Signup / Onboarding

- **`/signup`** — a public platform page (outside `/admin`), added to the
  proxy's public allowances. One form: email, password, store name (all
  required; Arabic + English labels acceptable, following existing UI copy).
- **Server action `signUpAndCreateStore`**:
  1. `auth.api.signUpEmail({ email, password, name })` (creates `User` + session).
  2. Derive a slug from the store name (slugify), ensure it is not reserved and
     not taken (append a numeric suffix on collision).
  3. Create the `Store` (owner = new user, `currency: "USD"`, `defaultLocale:
     "en"`, no custom domain).
  4. Return success; client redirects to `/admin`.
- If a logged-in user who already owns a store hits `/signup`, redirect to
  `/admin` (one store per user in v1).
- Errors (email taken, invalid input, slug generation failure) surface inline in
  the store owner's language, consistent with the existing login form.

## 6. Migration of the Existing Bookstore (one-time)

Idempotent script that adopts the current data into tenant #1:
1. Resolve the owner `User` by email (the account created via Plan 1's
   `create-user`); if absent, fail with a clear message telling the operator to
   create it first.
2. Create the owner's `Store` — `slug: "shaymas-books"`, `name` (the bookstore
   name), `currency: "ILS"`, `defaultLocale: "ar"`, `customDomain:
   "arabstories.shayma.me"`.
3. Stamp `storeId` on every existing `Book`, `Collection`, `Order`,
   `Transaction`, `StockMovement`.
4. Move global `Setting` rows into that store's `StoreSettings`.
5. Re-running is a no-op (guards on existing store / already-stamped rows).

Money is **not** converted here (stays `priceNis` = shekels, correct for the
ILS store; conversion is Plan 3).

## 7. Out of Scope (later plans)
- **Plan 3:** `Book`→`Product` / `Collection`→`Bundle` rename; `*Nis`→minor
  units + currency-aware formatting.
- **Plan 4:** per-store public storefront routing (`/[storeSlug]`), custom-domain
  self-serve.
- **Later:** per-store settings UI, currency/language pickers, branding
  (logo/colors), multiple stores per user, team members/roles.

## 8. Testing Focus
- **Isolation (highest priority):** given two stores A and B, every scoped read
  returns only the caller's rows; an update/delete targeting the other store's
  row is rejected; admin pages for A never surface B's products/orders/finance/
  stock.
- **Signup:** creates exactly one `User` and one `Store` with a unique,
  non-reserved slug; a second signup with a colliding store name gets a distinct
  slug; a logged-in owner is redirected instead of creating a second store.
- **Migration:** adopts every existing row into tenant #1, moves settings, is
  idempotent on re-run; no row is left without a `storeId`.
- **Storefront resolution:** the bookstore's host resolves to tenant #1;
  unknown host falls back to the primary store.

## 9. Risks / Open Items
- **Non-null `storeId` on existing tables** requires the migration to backfill
  before the column can be enforced non-null — the implementation plan must
  sequence: add nullable `storeId` → backfill (migration script) → enforce
  non-null. This ordering is a plan-level concern.
- **Every admin query must go through the gate** — a missed call site is a leak.
  The plan should add the scoped helper first and convert call sites
  systematically, with the isolation tests as the backstop.
- **Signup + Better Auth session timing** — `signUpEmail` establishes the
  session; store creation must use the just-created user's id. Verify the
  server-action ordering against the installed Better Auth version.
- Next.js 16 specifics (App Router, `proxy.ts`) confirmed at plan time per
  `AGENTS.md`.
