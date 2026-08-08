# Store Tenancy & Minimal Signup (Plan 2 of 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the `Store` concept, isolate every store's data behind a tenant gate, let a new person sign up and get their own store, and migrate the existing bookstore in as tenant #1 — without breaking the live bookstore.

**Architecture:** Add `Store` + `StoreSettings` Prisma models and a nullable `storeId` on each aggregate root, backfill existing rows into tenant #1, then enforce non-null. A single `getCurrentStore()` resolves the caller's store from their Better Auth session; every admin read/write and the storefront reads route through store-scoped access so cross-store data is unreachable. A combined `/signup` form creates the account and store together.

**Tech Stack:** Next.js 16 (App Router, `src/proxy.ts`), Prisma 6 + PostgreSQL (Neon dev DB), Better Auth 1.6.26, Vitest + happy-dom, Zod.

## Global Constraints

- **Builds on Plan 1 (merged).** Better Auth is wired: `src/lib/auth-server.ts` (`auth`), `src/lib/auth-guard.ts` (`getCurrentUser()`/`requireUser()`), email/password login, `src/proxy.ts` guards `/admin` via `getSessionCookie`, and admin pages/actions already call `requireUser`/`getCurrentUser`.
- **Next.js 16.2.10.** Middleware is `src/proxy.ts`. Confirm App Router / proxy APIs against the installed package per `AGENTS.md` before writing Next-specific code.
- **Database is the Neon DEV database** configured in `.env` (`POSTGRES_PRISMA_URL` pooled / `POSTGRES_URL_NON_POOLING` direct). Never point migrations at production. Migrations here run against dev.
- **`npm run build` clean and `npm test` green after every task.** The bookstore admin and storefront must keep working.
- **No money changes and no `Book`→`Product` rename** — those are Plan 3. Keep `priceNis` and current model names.
- **No new store's public storefront** — that's Plan 4. This plan gives new owners an admin only.
- **Tenant isolation is the safety property.** Every store-owned read filters by `storeId`; every create stamps it; every update/delete verifies ownership. A missed call site is a leak — the isolation tests are the backstop.
- **UI copy** stays consistent with the existing Arabic/RTL app; new store-owner-facing text follows existing components.

---

### Task 1: `Store` + `StoreSettings` models and nullable `storeId` columns

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration under `prisma/migrations/` (via `prisma migrate dev`)
- Create: `src/lib/__tests__/schema-tenancy.test.ts`

**Interfaces:**
- Consumes: existing `User` model.
- Produces: `Store` and `StoreSettings` models; a nullable `storeId String?` + relation on `Book`, `Collection`, `Order`, `Transaction`, `StockMovement`. Later tasks rely on `prisma.store`, `prisma.storeSettings`, and `.storeId` on those models.

- [ ] **Step 1: Edit the schema — add models**

Add to `prisma/schema.prisma`:
```prisma
model Store {
  id            String         @id @default(cuid())
  slug          String         @unique
  name          String
  currency      String         @default("USD")
  defaultLocale String         @default("en")
  customDomain  String?        @unique
  ownerId       String
  owner         User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  settings      StoreSettings[]
  books         Book[]
  collections   Collection[]
  orders        Order[]
  transactions  Transaction[]
  stockMovements StockMovement[]

  @@index([ownerId])
}

model StoreSettings {
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  key       String
  value     String
  updatedAt DateTime @updatedAt

  @@id([storeId, key])
}
```
Add the back-relation on `User`: `stores Store[]` (a user may own stores).

- [ ] **Step 2: Edit the schema — add nullable `storeId` to the 5 roots**

On `Book`, `Collection`, `Order`, `Transaction`, `StockMovement`, add:
```prisma
  storeId String?
  store   Store?  @relation(fields: [storeId], references: [id])
```
Add `@@index([storeId])` to each. Do NOT change `slug` uniqueness yet (Task 4, after backfill).

- [ ] **Step 3: Create and apply the migration**

Run:
```bash
npx prisma migrate dev --name add_store_and_nullable_store_id
```
Expected: migration created and applied to the dev DB; `prisma generate` runs.

- [ ] **Step 4: Write a schema smoke test**

Create `src/lib/__tests__/schema-tenancy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";

describe("tenancy schema", () => {
  it("exposes Store and StoreSettings models", () => {
    const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
    expect(models).toContain("Store");
    expect(models).toContain("StoreSettings");
  });
  it("adds storeId to the aggregate roots", () => {
    for (const model of ["Book", "Collection", "Order", "Transaction", "StockMovement"]) {
      const fields = Prisma.dmmf.datamodel.models.find((m) => m.name === model)!.fields.map((f) => f.name);
      expect(fields).toContain("storeId");
    }
  });
});
```

- [ ] **Step 5: Verify build + tests**

Run: `npm run build && npm test`
Expected: clean build; new schema test passes; existing tests still green (nullable `storeId` doesn't break current queries).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/__tests__/schema-tenancy.test.ts
git commit -m "feat(tenancy): add Store/StoreSettings models and nullable storeId"
```

---

### Task 2: `getCurrentStore()` + slug utilities

**Files:**
- Create: `src/lib/store-context.ts`
- Create: `src/lib/store-slug.ts`
- Create: `src/lib/__tests__/store-slug.test.ts`
- Create: `src/lib/__tests__/store-context.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser` from `@/lib/auth-guard`; `prisma`.
- Produces:
  - `getCurrentStore(): Promise<Store | null>` — the signed-in user's store (via `ownerId`), or null.
  - `requireStore(): Promise<Store>` — throws `Error("No store")` when null.
  - `slugify(name: string): string`
  - `RESERVED_SLUGS: string[]`
  - `isReservedSlug(slug: string): boolean`
  - `uniqueStoreSlug(name: string, exists: (slug: string) => Promise<boolean>): Promise<string>` — slugified base, numeric suffix on collision, never a reserved slug.

- [ ] **Step 1: Write failing tests for the slug utilities**

Create `src/lib/__tests__/store-slug.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify, isReservedSlug, uniqueStoreSlug } from "@/lib/store-slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Shayma's Books")).toBe("shaymas-books");
  });
  it("strips leading/trailing separators", () => {
    expect(slugify("  Hello!!  ")).toBe("hello");
  });
});

describe("isReservedSlug", () => {
  it("flags reserved words", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("janes-crafts")).toBe(false);
  });
});

describe("uniqueStoreSlug", () => {
  it("returns the base slug when free", async () => {
    expect(await uniqueStoreSlug("Jane's Crafts", async () => false)).toBe("janes-crafts");
  });
  it("suffixes on collision", async () => {
    const taken = new Set(["janes-crafts", "janes-crafts-2"]);
    expect(await uniqueStoreSlug("Jane's Crafts", async (s) => taken.has(s))).toBe("janes-crafts-3");
  });
  it("never returns a reserved slug", async () => {
    expect(await uniqueStoreSlug("admin", async () => false)).toBe("admin-2");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test src/lib/__tests__/store-slug.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the slug utilities**

Create `src/lib/store-slug.ts`:
```ts
export const RESERVED_SLUGS = ["admin", "login", "signup", "api", "_next", "logout"];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

export async function uniqueStoreSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "store";
  let candidate = base;
  let n = 1;
  while (isReservedSlug(candidate) || (await exists(candidate))) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test src/lib/__tests__/store-slug.test.ts` → all pass.

- [ ] **Step 5: Write failing test for `getCurrentStore`**

Create `src/lib/__tests__/store-context.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCurrentUser = vi.fn();
const findFirst = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ getCurrentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { store: { findFirst } } }));

import { getCurrentStore, requireStore } from "@/lib/store-context";

beforeEach(() => { getCurrentUser.mockReset(); findFirst.mockReset(); });

describe("getCurrentStore", () => {
  it("returns null when no user", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await getCurrentStore()).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
  it("returns the user's store", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", name: "A" });
    findFirst.mockResolvedValue({ id: "s1", ownerId: "u1" });
    expect(await getCurrentStore()).toEqual({ id: "s1", ownerId: "u1" });
    expect(findFirst).toHaveBeenCalledWith({ where: { ownerId: "u1" } });
  });
});

describe("requireStore", () => {
  it("throws when there is no store", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", name: "A" });
    findFirst.mockResolvedValue(null);
    await expect(requireStore()).rejects.toThrow("No store");
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npm test src/lib/__tests__/store-context.test.ts` → FAIL (module not found).

- [ ] **Step 7: Implement `getCurrentStore`/`requireStore`**

Create `src/lib/store-context.ts`:
```ts
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import type { Store } from "@prisma/client";

export async function getCurrentStore(): Promise<Store | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.store.findFirst({ where: { ownerId: user.id } });
}

export async function requireStore(): Promise<Store> {
  const store = await getCurrentStore();
  if (!store) throw new Error("No store");
  return store;
}
```

- [ ] **Step 8: Run to verify pass, then full suite**

Run: `npm test src/lib/__tests__/store-context.test.ts` then `npm test`
Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add src/lib/store-context.ts src/lib/store-slug.ts src/lib/__tests__/store-slug.test.ts src/lib/__tests__/store-context.test.ts
git commit -m "feat(tenancy): add getCurrentStore and store-slug utilities"
```

---

### Task 3: Scope admin actions and dashboard reads to the current store

**Files:**
- Modify: `src/actions/books.ts`, `src/actions/collections.ts`, `src/actions/finance.ts`, `src/actions/media.ts`, `src/actions/orders.ts`, `src/actions/settings.ts`, `src/actions/stock.ts`
- Modify: the admin dashboard pages under `src/app/admin/(dashboard)/` that query Prisma directly (`page.tsx` for orders, books, collections, finance, stock, and the dashboard root)
- Modify: `src/lib/settings.ts` (per-store settings via `StoreSettings`)
- Create: `src/actions/__tests__/tenancy-isolation.test.ts`

**Interfaces:**
- Consumes: `requireStore` from `@/lib/store-context`.
- Produces: all admin reads/writes scoped by `storeId`. Establishes the pattern the storefront (Task 6) reuses.

- [ ] **Step 1: Write the failing isolation test (representative actions)**

Create `src/actions/__tests__/tenancy-isolation.test.ts`. Mock `requireStore` to return store A, and `prisma` with spies; assert that a read action passes `where: { storeId: "A" }`, a create stamps `storeId: "A"`, and a delete verifies ownership. Example for the orders read + a stock create:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const requireStore = vi.fn();
vi.mock("@/lib/store-context", () => ({ requireStore }));

const stockCreate = vi.fn();
const bookUpdate = vi.fn();
const bookFindFirst = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    stockMovement: { create: stockCreate },
    book: { update: bookUpdate, findFirst: bookFindFirst, aggregate: vi.fn().mockResolvedValue({ _sum: {} }) },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createStockMovement } from "@/actions/stock";

beforeEach(() => { requireStore.mockReset(); stockCreate.mockReset(); requireStore.mockResolvedValue({ id: "A" }); });

describe("stock action tenancy", () => {
  it("stamps storeId on create", async () => {
    stockCreate.mockResolvedValue({ id: "m1" });
    await createStockMovement({ bookId: "b1", type: "ADJUSTMENT", quantity: 1, note: null });
    expect(stockCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ storeId: "A" }) }));
  });
});
```
(Extend with one read-scoping and one update/delete-ownership case using the same mocking approach; keep each assertion about the `where`/`data` the action passes.)

- [ ] **Step 2: Run to verify failure**

Run: `npm test src/actions/__tests__/tenancy-isolation.test.ts`
Expected: FAIL — actions don't yet call `requireStore`/stamp `storeId`.

- [ ] **Step 3: Apply the scoping pattern to every action**

In EACH of the 7 action files, replace `const user = await requireUser()` (or the `requireUser()` call) with `const store = await requireStore()` where the action needs the store (keep `requireUser` only where no store row is touched). Then:
- **Reads:** add `where: { storeId: store.id, ...existing }`.
- **Creates:** add `storeId: store.id` to `data`.
- **Updates/deletes:** change `where: { id }` to a store-scoped guard — e.g. `updateMany({ where: { id, storeId: store.id }, data })`, or fetch-then-verify `findFirst({ where: { id, storeId: store.id } })` and 404/throw if missing, so a caller cannot mutate another store's row.

The 19 mutation entry points (from Plan 1's audit) are: `books.ts` (createBook, setBookArchived), `collections.ts` (updateCollection, setCollectionBooks), `finance.ts` (createTransaction, deleteTransaction, recordPayment), `media.ts` (attachMedia, deleteMedia, reorderMedia, updateBook), `orders.ts` (updateOrderStatus, deleteOrder, setOrderDiscount, updateOrderCustomerInfo, updateOrderItems), `settings.ts` (updateAutoStockSetting), `stock.ts` (createStockMovement, deleteStockMovement). Scope each. For actions that join to a `Book`/`Collection`/`Order` by id (e.g. media attaching to a book), verify that parent belongs to `store.id`.

- [ ] **Step 4: Make settings per-store**

In `src/lib/settings.ts`, change `getAutoStockEnabled`/`setAutoStockEnabled` to take `storeId` and read/write `prisma.storeSettings` keyed by `(storeId, AUTO_STOCK_SETTING_KEY)`. Update callers (the settings action and any fulfillment logic) to pass `store.id`.

- [ ] **Step 5: Scope the admin dashboard page reads**

In each admin `(dashboard)` `page.tsx` that queries Prisma directly, call `const store = await getCurrentStore()` (import from `@/lib/store-context`); if null, `redirect("/admin/login")`; then add `where: { storeId: store.id }` to every query on the page.

- [ ] **Step 6: Run the isolation tests + full suite + build**

Run: `npm test && npm run build`
Expected: isolation tests pass; full suite green; clean build.

- [ ] **Step 7: Commit**

```bash
git add src/actions src/app/admin src/lib/settings.ts src/actions/__tests__/tenancy-isolation.test.ts
git commit -m "feat(tenancy): scope admin actions and dashboard reads by store"
```

---

### Task 4: Adopt-bookstore migration script + enforce non-null `storeId`

**Files:**
- Create: `scripts/adopt-store.ts`
- Create: `scripts/__tests__/adopt-store.test.ts`
- Modify: `package.json` (add `adopt-store` script)
- Modify: `prisma/schema.prisma` (storeId → non-null; per-store slug uniqueness)
- Create: migration (non-null + unique changes)

**Interfaces:**
- Consumes: `prisma`; `slugify` from `@/lib/store-slug`.
- Produces: `adoptStore(ownerEmail, opts)` that creates tenant #1's store and stamps every existing row; a schema where `storeId` is required.

- [ ] **Step 1: Write the failing test for the adopt logic**

Create `scripts/__tests__/adopt-store.test.ts` — test the pure decision logic of `buildStoreData(ownerId, opts)` (returns the `Store` create payload with slug `shaymas-books`, currency `ILS`, locale `ar`, customDomain `arabstories.shayma.me` by default; overridable). Assert defaults and overrides.

- [ ] **Step 2: Run to verify failure**

Run: `npm test scripts/__tests__/adopt-store.test.ts` → FAIL.

- [ ] **Step 3: Implement the script**

Create `scripts/adopt-store.ts` exporting `buildStoreData` (pure) and a `main()` guarded on direct invocation. `main()`:
1. Looks up the owner `User` by `process.env`/argv email; if absent, exits with a message to create it via `create-user` first.
2. Upserts the store (idempotent on `slug`).
3. In a transaction, `updateMany` each of `Book`/`Collection`/`Order`/`Transaction`/`StockMovement` `where: { storeId: null }` → `data: { storeId: store.id }`.
4. Moves any global-key settings into `StoreSettings` for that store.
Money is NOT converted.

- [ ] **Step 4: Run to verify pass**

Run: `npm test scripts/__tests__/adopt-store.test.ts` → pass. Add the `adopt-store` npm script.

- [ ] **Step 5: Run the adoption against the dev DB**

Run: `npm run adopt-store -- owner@example.com` (use the dev owner account). Expected: store created, existing rows (if any) stamped. Idempotent on re-run.

- [ ] **Step 6: Enforce non-null + per-store slug uniqueness**

Now that no row has a null `storeId`, edit `prisma/schema.prisma`: make `storeId String` (non-null) and `store Store @relation(...)` on the 5 roots; change `Book.slug`/`Collection.slug` from `@unique` to `@@unique([storeId, slug])`. Then:
```bash
npx prisma migrate dev --name enforce_store_id_not_null
```
Expected: applies cleanly (dev rows are backfilled).

- [ ] **Step 7: Build + full suite**

Run: `npm run build && npm test`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add scripts/adopt-store.ts scripts/__tests__/adopt-store.test.ts package.json prisma/schema.prisma prisma/migrations
git commit -m "feat(tenancy): adopt bookstore as tenant #1 and enforce non-null storeId"
```

> **Production note (not a code step):** on deploy, run `adopt-store` against production BEFORE the `enforce_store_id_not_null` migration is applied there, or the non-null migration will fail on un-backfilled rows.

---

### Task 5: Minimal signup — combined `/signup` form

**Files:**
- Create: `src/app/(platform)/signup/page.tsx` (or `src/app/signup/page.tsx`)
- Create: `src/components/auth/SignupForm.tsx`
- Create: `src/actions/signup.ts`
- Modify: `src/lib/validations.ts` (signup schema)
- Modify: `src/proxy.ts` (ensure `/signup` is public — it is not under `/admin`, so confirm the matcher doesn't guard it)
- Create: `src/actions/__tests__/signup.test.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth-server`; `uniqueStoreSlug` from `@/lib/store-slug`; `prisma`.
- Produces: `signUpAndCreateStore(input): Promise<{ ok: true } | { ok: false; error: string }>`.

- [ ] **Step 1: Add the signup schema (failing test first)**

Add to `src/lib/__tests__/validations.test.ts` a `signupSchema` case: valid email + password (min length) + non-empty store name passes; bad email / short password / empty store name fail. Run → FAIL.

- [ ] **Step 2: Implement `signupSchema`** in `src/lib/validations.ts` (`email`, `password` min 8, `storeName` min 1, Arabic messages). Run the validations test → pass.

- [ ] **Step 3: Write the failing test for the action**

Create `src/actions/__tests__/signup.test.ts`: mock `auth.api.signUpEmail` to return a new user, mock `prisma.store.findUnique` (slug free) and `prisma.store.create`. Assert `signUpAndCreateStore` calls `signUpEmail`, then creates a store with a slugified unique name owned by the new user, and returns `{ ok: true }`. Add a case where the email is already taken → `{ ok: false }`.

- [ ] **Step 4: Run to verify failure** → FAIL (module not found).

- [ ] **Step 5: Implement `signUpAndCreateStore`**

Create `src/actions/signup.ts` (`"use server"`): validate with `signupSchema`; call `auth.api.signUpEmail({ body: { email, password, name: storeName } })`; on success derive `uniqueStoreSlug(storeName, slug => prisma.store.findUnique({ where: { slug } }).then(Boolean))`; `prisma.store.create({ data: { slug, name: storeName, ownerId: newUser.id } })` (defaults currency USD / locale en); return `{ ok: true }`. Map known errors (email exists, validation) to `{ ok: false, error }`.

- [ ] **Step 6: Run to verify pass** → all pass.

- [ ] **Step 7: Build the page + form**

Create the `/signup` page and `SignupForm.tsx` (client component): fields email, password, store name; submit calls `signUpAndCreateStore`; on `{ ok: true }` `router.push("/admin")` + `router.refresh()`; on error show the message. Mirror `LoginForm.tsx`'s styling and Arabic copy. Add a link from the login page to `/signup` and back.

- [ ] **Step 8: Confirm `/signup` is public + guard against double stores**

Confirm `src/proxy.ts` matcher does not cover `/signup`. In the signup page (server component), if `getCurrentStore()` returns a store, `redirect("/admin")`.

- [ ] **Step 9: Verify (build + tests + manual)**

Run: `npm run build && npm test`. Then `npm run dev`, open `/signup`, create a test account+store, confirm landing on `/admin` with an empty dashboard scoped to the new store; confirm the bookstore owner still sees only their data.

- [ ] **Step 10: Commit**

```bash
git add src/app src/components/auth src/actions/signup.ts src/lib/validations.ts src/actions/__tests__/signup.test.ts src/lib/__tests__/validations.test.ts
git commit -m "feat(signup): combined signup form that creates account and store"
```

---

### Task 6: Storefront resolves to a store by host

**Files:**
- Create: `src/lib/storefront-store.ts`
- Modify: `src/lib/data.ts` (public reads take/scope by `storeId`)
- Modify: the storefront pages under `src/app/(site)/` that call `data.ts`
- Create: `src/lib/__tests__/storefront-store.test.ts`

**Interfaces:**
- Consumes: `prisma`; request `Host` header.
- Produces: `resolveStorefrontStore(host: string): Promise<Store | null>` — matches `Store.customDomain`, else the primary store (tenant #1); storefront `data.ts` functions accept a `storeId`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/storefront-store.test.ts`: mock `prisma.store.findFirst`. Assert `resolveStorefrontStore("arabstories.shayma.me")` returns the store whose `customDomain` matches; when no custom domain matches, it falls back to the primary store (the earliest-created store, or the one flagged primary); returns null only if no stores exist.

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement `resolveStorefrontStore`**

Create `src/lib/storefront-store.ts`: `findFirst({ where: { customDomain: host } })`; if null, `findFirst({ orderBy: { createdAt: "asc" } })` (tenant #1 is the oldest). Return it.

- [ ] **Step 4: Run to verify pass** → pass.

- [ ] **Step 5: Scope `data.ts` public reads**

Change `getBooks`, `getBookBySlug`, `getCollections`, and any other storefront reader to accept a `storeId` and add it to the `where`. Update the `(site)` pages to resolve the store first (via `resolveStorefrontStore` using the request `Host` from `next/headers`), 404 if null, then pass `store.id` into the data calls. The `createOrder` checkout action must also stamp `storeId` (resolve from the storefront store) so customer orders land on the right tenant.

- [ ] **Step 6: Verify (build + tests + manual)**

Run: `npm run build && npm test`. Then `npm run dev`; confirm the bookstore storefront still lists its books and checkout creates an order on tenant #1.

- [ ] **Step 7: Commit**

```bash
git add src/lib/storefront-store.ts src/lib/data.ts src/app/\(site\) src/lib/__tests__/storefront-store.test.ts
git commit -m "feat(tenancy): resolve storefront to a store by host and scope public reads"
```

---

## Self-Review

**1. Spec coverage:** ✅ Store/StoreSettings + storeId (Task 1); getCurrentStore + slugs (Task 2); tenant gate over admin actions/pages + per-store settings (Task 3); migration adopting tenant #1 + non-null enforcement + per-store slug uniqueness (Task 4); combined signup creating account+store, reserved/duplicate slug handling, double-store guard (Task 5); storefront host resolution + public read scoping + checkout stamping (Task 6). Deferred items (money, rename, storefront routing for new stores) are honored — none appear as tasks.

**2. Placeholder scan:** Novel logic has real code (models, utilities, context, script, signup action, resolver). The repetitive action-scoping (Task 3 Step 3) is specified as one explicit pattern applied to a named, exhaustive list of 19 entry points rather than 7 near-identical code dumps — the pattern and every call site are named, so it is actionable without a placeholder.

**3. Type consistency:** `getCurrentStore`/`requireStore` return `Store`; `uniqueStoreSlug(name, exists)` signature is identical in Task 2's test, its implementation, and its use in Task 5; `storeId` is the field name throughout; `resolveStorefrontStore(host)` matches between Task 6's test and implementation.

**4. Sequencing safety:** nullable `storeId` (Task 1) → scoped writes stamp it (Task 3) → backfill + non-null (Task 4) is the ordering §9 of the spec requires; the app builds at each commit because scoping resolves `storeId` at runtime regardless of column nullability, and the non-null migration only runs after backfill.
