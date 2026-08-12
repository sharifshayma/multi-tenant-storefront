# Demo environment seed — design

**Date:** 2026-08-12
**Status:** Approved (design), pending implementation plan

## Goal

Give the multi-tenant storefront a one-command, self-contained **demo environment**: an
isolated demo tenant preseeded with a full book catalog *and* the transactional data
(orders, customers, finance, stock) that makes the admin dashboard look alive. Anyone can
run it locally against their own database and immediately explore both the storefront and
every admin screen with realistic data.

Inspiration: the existing `prisma/seed.ts` book seed. That seed only creates catalog data
(books + collections) and requires a pre-existing adopted store. The demo goes further:
it creates its own tenant + login and populates orders/transactions/stock.

## Non-goals

- No hosted/deployed demo instance (that was explicitly out of scope — in-repo seed only).
- No changes to the real `shaymas-books` tenant or its seed.
- No new product vertical — the demo sells the same bilingual children's books.
- No demo-specific app/runtime code (no "demo mode" banner, no auto-reset cron). Just a seed.

## Key decisions

1. **Isolated demo tenant.** The demo never touches real data. It owns:
   - a demo user `demo@demo.store` (password surfaced in script output),
   - a demo store (slug `demo`, name e.g. "Demo Bookshop / متجر تجريبي").
2. **Delivery:** new branch `demo-seed` → PR → merge to `main` once tests/CI pass.
3. **Deterministic.** A small seeded PRNG (mulberry32) drives all randomness so repeated
   runs produce identical data (stable screenshots, reviewable diffs). No `Math.random()`.
4. **Idempotent + resettable.** Re-running `npm run seed:demo` yields the same clean demo:
   user/store/catalog are upserted; the demo store's transactional data is wiped and
   regenerated. All destructive operations are scoped by `storeId = <demo store>` — no
   other tenant's rows are ever read or deleted.

## Components

### 1. Entry point — `prisma/seed-demo.ts` + `npm run seed:demo`

New script wired as an npm script (`"seed:demo": "tsx prisma/seed-demo.ts"`). Orchestrates,
in order:

1. `ensureDemoUser()` → `ensureDemoStore()` → `seedCatalog(store)` →
   `resetTransactionalData(store)` → `seedTransactionalData(store)`.
2. Prints a summary: store slug, demo login email/password, counts seeded.

### 2. Demo user — `ensureDemoUser()`

- Look up `demo@demo.store`. If missing, create via `auth.api.signUpEmail(...)` (better-auth),
  the same path `scripts/create-user.ts` uses — this is the only way to get a valid password
  hash + `Account` row. Idempotent: swallow the "user already exists" case and re-fetch.
- Returns the user id.

### 3. Demo store — `ensureDemoStore(ownerId)`

- `prisma.store.upsert({ where: { slug: "demo" }, ... })` using `buildStoreData(ownerId, {
  slug: "demo", name: "Demo Bookshop", customDomain: null, ... })` from `scripts/adopt-store.ts`
  for the create payload. Reuses existing store-shaping logic rather than duplicating it.

### 4. Catalog — `seedCatalog(store)`

- Reuse the exact book + collection data from `prisma/seed.ts` (14 books, 4 curated
  collections, 1 build-your-own). Extract the shared data arrays into
  `prisma/demo-data/catalog.ts` so both seeds import one source of truth (no divergence).
- Upsert by `storeId_slug`, identical to the real seed. Sets `priceMinor` per book.

### 5. Reset — `resetTransactionalData(store)`

- Delete, scoped strictly to the demo `storeId`, in FK-safe order:
  `StockMovement` → `Transaction` → `OrderCollectionItemBook` → `OrderCollectionItem` →
  `OrderItem` → `Order`. (Catalog rows are kept — they're upserted, not wiped.)

### 6. Transactional data — `seedTransactionalData(store)`

Deterministic generation over the last 90 days:

- **~20 customers:** fixed roster of realistic Arabic/English names, phones, cities
  (Dubai, Riyadh, Cairo, Amman, …). Customers are denormalized onto orders (schema has no
  Customer table — `Order` carries `customerName`/`phone`/`email`/`city`), so "customer"
  = a reused identity across multiple orders.
- **~40 orders:** dates spread across 90 days weighted toward recent; status drawn by age
  (older → DELIVERED/SHIPPED, newer → NEW/CONFIRMED) across all five `OrderStatus` values.
  Each order has 1–3 line items mixing single books (`OrderItem`) and collections
  (`OrderCollectionItem` + selected books for build-your-own). Some carry a
  `discountMinor` + `discountReason`. `totalMinor` computed from items minus discount.
- **Transactions:** one `REVENUE` row per order that has reached a paid/shipped state
  (linked via `orderId`), plus ~15 `EXPENSE` rows (categories: printing, ads, shipping,
  supplies) dated within the window — so the finance page shows a real revenue/expense/
  profit picture.
- **StockMovements:** per book, a `PRINTED` batch establishing initial stock, `SHIPPED`
  movements tied to shipped/delivered orders, and a few `ADJUSTMENT`/`DAMAGED` entries, so
  each book shows a plausible non-negative on-hand level.

## Data-integrity rules

- All money in **minor units** (int), matching the schema.
- `totalMinor` on each order == sum(item qty × unitPriceMinor) − discountMinor, ≥ 0.
- Stock never goes negative for any book after all movements.
- Every generated row carries the demo `storeId`; nothing writes cross-tenant.

## Testing

Vitest, matching `scripts/__tests__` conventions. Unit-test the **pure** generators (no DB):

- PRNG determinism: same seed → identical sequence.
- Order builder: `totalMinor` invariant holds incl. discounts; statuses cover all five
  values; dates fall within the window.
- Stock builder: per-book net on-hand is ≥ 0 across the generated movement set.
- Customer roster: stable, no duplicate identities beyond intended reuse.

Extract generators as pure functions returning plain objects so they test without a
database; the seed script is the thin IO shell that persists them.

## Documentation

- README section: "Demo environment" — `npm run seed:demo`, the demo login, what gets
  created, and that it's safe to re-run/reset.
- Script output prints the login + counts on every run.

## Rollout

Branch `demo-seed` → PR. Merge to `main` after `npm test` and CI pass.
