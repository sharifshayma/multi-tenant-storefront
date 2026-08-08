# Per-Store Wording & Multi-Currency Money (Plan 3 of 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store prices as integer minor units with per-store currency-aware formatting, and let each store display its own product noun — without renaming the `Book` model.

**Architecture:** Rename the money columns `*Nis` → `*Minor` (data-preserving `RENAME COLUMN`) and multiply existing values `×100`; format money with `Intl.NumberFormat` driven by each store's `currency`/`defaultLocale`. Add `itemNounSingular`/`itemNounPlural` to `Store` and thread them through UI copy. The `Book`/`Collection` models, routes, and `/books` URL are untouched.

**Tech Stack:** Next.js 16, Prisma 6 + Supabase Postgres (prod) / Neon (dev), Vitest.

## Global Constraints

- **Do NOT rename the `Book`/`Collection` models, files, routes, or the `/books/{slug}` URL.** Only money fields and UI wording change.
- **Prisma field renames default to DROP+ADD (data loss).** Every column rename must be produced with `prisma migrate dev --create-only` and hand-edited to `ALTER TABLE ... RENAME COLUMN`. Never let Prisma drop+recreate a money column.
- **Money is integer minor units** after this plan (e.g. `4000` = 40.00). The `×100` value transform runs exactly once (carried in the migration, tied to Prisma migration history — never re-run manually).
- Dev DB is the Neon DB in `.env`; migrations run there. Production (Supabase) money migration is a deploy-time step (§ runbook in Task 1) — not run during these tasks.
- `npm run build` clean and `npm test` green after every task.
- UI copy stays Arabic/RTL. New wording defaults: `itemNounSingular="منتج"`, `itemNounPlural="منتجات"`; the existing bookstore store is set to `"كتاب"`/`"كتب"`.
- Next.js 16.2.10.

---

### Task 1: Rename money fields `*Nis` → `*Minor` (+ `×100` migration)

**Files:**
- Modify: `prisma/schema.prisma` (money fields on `Book`, `Collection`, `Order`, `OrderItem`, `OrderCollectionItem`, `Transaction`)
- Create: migration (via `--create-only`, hand-edited)
- Modify: `src/actions/*.ts`, `src/lib/data.ts`, `src/lib/payment-status.ts`, `src/lib/validations.ts`, `src/lib/constants.ts`, `src/lib/resend.ts`, storefront/admin components referencing `*Nis`, `prisma/seed.ts`
- Modify: `docs/DEPLOY.md` (add the money-migration production runbook)
- Test: `src/lib/__tests__/payment-status.test.ts` (create if absent) covering the money math with the new names

**Interfaces:**
- Consumes: nothing new.
- Produces: money columns named `*Minor` holding integer minor units. Field map: `Book.priceMinor`, `Collection.priceMinor`, `Order.totalMinor`, `Order.discountMinor`, `OrderItem.unitPriceMinor`, `OrderCollectionItem.unitPriceMinor`, `Transaction.amountMinor`.

- [ ] **Step 1: Rename the fields in `prisma/schema.prisma`**

Change each money field name (keep `Int` type): `priceNis`→`priceMinor` (Book, Collection), `totalNis`→`totalMinor` + `discountNis`→`discountMinor` (Order), `unitPriceNis`→`unitPriceMinor` (OrderItem, OrderCollectionItem), `amountNis`→`amountMinor` (Transaction).

- [ ] **Step 2: Generate the migration WITHOUT applying, then hand-edit to RENAME + ×100**

Run:
```bash
npx prisma migrate dev --create-only --name money_to_minor_units
```
Open the generated `migration.sql`. Prisma will have written `DROP COLUMN`/`ADD COLUMN` pairs — **replace them** with data-preserving renames plus the value transform:
```sql
ALTER TABLE "Book" RENAME COLUMN "priceNis" TO "priceMinor";
ALTER TABLE "Collection" RENAME COLUMN "priceNis" TO "priceMinor";
ALTER TABLE "Order" RENAME COLUMN "totalNis" TO "totalMinor";
ALTER TABLE "Order" RENAME COLUMN "discountNis" TO "discountMinor";
ALTER TABLE "OrderItem" RENAME COLUMN "unitPriceNis" TO "unitPriceMinor";
ALTER TABLE "OrderCollectionItem" RENAME COLUMN "unitPriceNis" TO "unitPriceMinor";
ALTER TABLE "Transaction" RENAME COLUMN "amountNis" TO "amountMinor";

UPDATE "Book" SET "priceMinor" = "priceMinor" * 100;
UPDATE "Collection" SET "priceMinor" = "priceMinor" * 100;
UPDATE "Order" SET "totalMinor" = "totalMinor" * 100, "discountMinor" = "discountMinor" * 100;
UPDATE "OrderItem" SET "unitPriceMinor" = "unitPriceMinor" * 100;
UPDATE "OrderCollectionItem" SET "unitPriceMinor" = "unitPriceMinor" * 100;
UPDATE "Transaction" SET "amountMinor" = "amountMinor" * 100;
```

- [ ] **Step 3: Apply the migration to the dev DB**

Run: `npx prisma migrate dev` (applies the hand-edited migration) then `npx prisma generate`.
Expected: applies cleanly; the dev DB columns are renamed (any existing rows ×100).

- [ ] **Step 4: Update every code reference `*Nis` → `*Minor`**

Rename all identifiers: `grep -rl "Nis" src prisma` and update each `priceNis`/`totalNis`/`discountNis`/`unitPriceNis`/`amountNis` → `*Minor`. Also rename derived local names for consistency: `paidNis`→`paidMinor`, `outstandingNis`→`outstandingMinor`, `setPriceNis`→`setPriceMinor`, `totalDiscountNis`→`totalDiscountMinor` (in `payment-status.ts`, `finance`/`stock` actions, components). Update `DEFAULT_PRICE_NIS`→`DEFAULT_PRICE_MINOR = 4000` in `src/lib/constants.ts`. No `Nis` identifier may remain: `grep -rn "Nis" src prisma` returns nothing after this step.

- [ ] **Step 5: Money-math test**

Create/extend `src/lib/__tests__/payment-status.test.ts` asserting the renamed money math is unchanged — e.g. amount payable = `totalMinor - sum(REVENUE amountMinor for the order)`, with concrete integer values (e.g. total `4000`, paid `1500` → outstanding `2500`). Run it.

- [ ] **Step 6: Add the production money-migration runbook to `docs/DEPLOY.md`**

Append a section: the `money_to_minor_units` migration is a one-time `×100` value transform on live prices — before the prod deploy that includes it, **(a)** `pg_dump` backup, **(b)** restore into a throwaway local pg17 and run `npm run db:migrate` there to confirm every money value is exactly `×100` and order line items still reconcile, **(c)** then run `npm run db:migrate` against production, **(d)** then `vercel --prod`. Never run the `×100` step twice.

- [ ] **Step 7: Build + full suite**

Run: `npm run build && npm test`
Expected: clean build; all tests green.

- [ ] **Step 8: Commit**

```bash
git add prisma src/actions src/lib src/components src/app docs/DEPLOY.md
git commit -m "feat(money): store prices as minor units (rename *Nis->*Minor, x100 migration)"
```

---

### Task 2: Currency-aware money formatting

**Files:**
- Create: `src/lib/format-money.ts`
- Create: `src/lib/__tests__/format-money.test.ts`
- Modify: `src/components/ui/Price.tsx`, `src/lib/resend.ts` (order email), and callers that render a price (pass `currency`/`locale` from the store)

**Interfaces:**
- Consumes: a money value in minor units + a store's `currency` and `defaultLocale`.
- Produces: `formatMoney(minor: number, currency: string, locale: string): string`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/format-money.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/format-money";

describe("formatMoney", () => {
  it("formats ILS in Arabic", () => {
    expect(formatMoney(4000, "ILS", "ar")).toContain("40");
  });
  it("formats USD in English with 2 decimals", () => {
    expect(formatMoney(4050, "USD", "en")).toBe("$40.50");
  });
  it("treats the input as minor units (divides by 100)", () => {
    expect(formatMoney(100, "USD", "en")).toBe("$1.00");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL (module not found).

- [ ] **Step 3: Implement `formatMoney`**

Create `src/lib/format-money.ts`:
```ts
export function formatMoney(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Use it in `Price` and the order email**

Change `src/components/ui/Price.tsx` to take `currency` + `locale` props (or a preformatted string) and render `formatMoney(minor, currency, locale)` instead of the hard-coded `₪`. Thread `store.currency`/`store.defaultLocale` from the storefront/admin pages that render prices. In `src/lib/resend.ts`, format each money value with `formatMoney(value, order-store currency, locale)` instead of `${...} ₪`.

- [ ] **Step 6: Build + full suite** — `npm run build && npm test` → green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/format-money.ts src/lib/__tests__/format-money.test.ts src/components/ui/Price.tsx src/lib/resend.ts src/app
git commit -m "feat(money): currency-aware formatting via Intl.NumberFormat"
```

---

### Task 3: Per-store product noun on `Store`

**Files:**
- Modify: `prisma/schema.prisma` (`Store` gains two fields)
- Create: migration (`--create-only` not required — these are additive with defaults)
- Modify: `scripts/adopt-store.ts` / a one-off to set the bookstore's nouns; `src/lib/store-noun.ts` helper
- Test: `src/lib/__tests__/store-noun.test.ts`

**Interfaces:**
- Consumes: a `Store`.
- Produces: `Store.itemNounSingular` / `Store.itemNounPlural` (defaults `"منتج"`/`"منتجات"`); `storeNoun(store): { singular: string; plural: string }`.

- [ ] **Step 1: Add the fields**

In `prisma/schema.prisma` `Store`: `itemNounSingular String @default("منتج")` and `itemNounPlural String @default("منتجات")`.

- [ ] **Step 2: Migrate**

Run: `npx prisma migrate dev --name store_item_noun` (additive with defaults — safe). `npx prisma generate`.

- [ ] **Step 3: Set the bookstore's nouns**

Add to `scripts/adopt-store.ts`'s store creation (and a small idempotent update for the existing store) so tenant #1 gets `itemNounSingular: "كتاب"`, `itemNounPlural: "كتب"`. Document that this update runs against prod at deploy (the defaults already cover new stores).

- [ ] **Step 4: Noun helper (TDD)**

Create `src/lib/__tests__/store-noun.test.ts` asserting `storeNoun({ itemNounSingular: "كتاب", itemNounPlural: "كتب" })` → `{ singular: "كتاب", plural: "كتب" }`. Run → FAIL. Implement `src/lib/store-noun.ts`:
```ts
import type { Store } from "@prisma/client";
export function storeNoun(store: Pick<Store, "itemNounSingular" | "itemNounPlural">) {
  return { singular: store.itemNounSingular, plural: store.itemNounPlural };
}
```
Run → PASS.

- [ ] **Step 5: Build + full suite** — green.

- [ ] **Step 6: Commit**

```bash
git add prisma src/lib/store-noun.ts src/lib/__tests__/store-noun.test.ts scripts/adopt-store.ts
git commit -m "feat(wording): per-store product noun on Store"
```

---

### Task 4: Thread per-store nouns through the UI copy

**Files:**
- Modify: admin `(dashboard)` pages/components with hard-coded book words (nav "الكتب", the books page heading/empty states, order-item labels) and storefront components/pages that say "كتاب/كتب"

**Interfaces:**
- Consumes: `storeNoun(store)` (Task 3); the store is already resolved in admin pages (`getCurrentStore()`) and storefront pages (`resolveStorefrontContext`).

- [ ] **Step 1: Inventory the hard-coded book words**

Run: `grep -rn "كتاب\|الكتب\|كتب" src/app src/components` and list each user-facing occurrence that names the product (skip brand/site-name copy and anything under the platform landing).

- [ ] **Step 2: Replace with the store noun**

In each admin `(dashboard)` page/component that names the product, get `const { singular, plural } = storeNoun(store)` (the page already resolves the store) and substitute: nav label → `plural` ("الكتب" → `الkتب`/`plural`), headings/empty states → interpolate `singular`/`plural`. Do the same for storefront pages using their resolved store. The admin nav label change: replace the literal `"الكتب"` link text with `{plural}`.

- [ ] **Step 3: Confirm no product-naming book word remains hard-coded**

Run: `grep -rn "الكتب" src/app/admin src/app/\[storeSlug\] src/components/storefront` returns nothing (brand/site copy elsewhere is out of scope). Manually confirm the bookstore still shows "كتب" (its configured plural) and a default store would show "منتجات".

- [ ] **Step 4: Build + full suite** — `npm run build && npm test` → green.

- [ ] **Step 5: Commit**

```bash
git add src/app src/components
git commit -m "feat(wording): render per-store product noun in admin and storefront"
```

---

## Self-Review

**1. Spec coverage:** ✅ Money fields `*Nis`→`*Minor` + `×100` migration (Task 1); currency-aware `Intl` formatting (Task 2); per-store noun fields + defaults + bookstore set to كتاب/كتب (Task 3); noun threaded through UI (Task 4). ✅ `Book`/`Collection`/routes/URL untouched (Global Constraints + no rename tasks). ✅ Production `×100` runbook added to DEPLOY.md (Task 1 Step 6). Rehearsal-on-real-data is a deploy step, documented, not a build task.

**2. Placeholder scan:** Real SQL for the RENAME+×100 migration, real `formatMoney`/`storeNoun` code + tests. The two mechanical sweeps (code-ref rename in Task 1 Step 4; UI-copy threading in Task 4 Step 2) are specified as a concrete grep + a named substitution pattern, with a post-grep proving completeness — actionable, not placeholders.

**3. Type consistency:** the money field map (`priceMinor`/`totalMinor`/`discountMinor`/`unitPriceMinor`/`amountMinor`) is used identically in Tasks 1–2; `formatMoney(minor, currency, locale)` and `storeNoun(store)` signatures match their tests and call sites.

**4. Migration safety:** the Prisma drop+add default is explicitly overridden with `--create-only` + hand-edited `RENAME COLUMN` (Task 1 Steps 2–3), preserving data; the `×100` transform lives in that single migration tied to history so it runs once; the prod rollout is a documented, rehearsed, backed-up step.
