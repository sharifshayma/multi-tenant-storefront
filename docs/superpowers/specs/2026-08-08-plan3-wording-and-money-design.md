# Plan 3 — Per-Store Wording & Multi-Currency Money

**Date:** 2026-08-08
**Status:** Approved (design) — pending spec review before implementation plan
**Parent design:** [multi-store foundation](2026-08-08-multi-store-foundation-design.md)
**Predecessors:** Plans 1, 2 live in prod; Plan 4 merged to `main` (not yet deployed)

---

## 1. Goal

Make the platform usable by non-book stores and non-ILS currencies **without** the
high-churn `Book`→`Product` model rename. Two pieces:
1. **Per-store wording** — each store shows its own product noun (the bookstore
   keeps "كتاب/كتب"; a crafts store shows "منتج/منتجات"). The model stays `Book`
   internally; the word is data.
2. **Multi-currency money** — prices become integer **minor units** with per-store
   currency-aware formatting (replacing the hard-coded `₪`), plus a one-time
   `×100` migration of the existing shekel prices.

This deliberately **rejects** the original Plan 3's full `Book`→`Product` /
`Collection`→`Bundle` rename (huge churn, would make the bookstore's own admin say
"products", zero functional gain).

## 2. Locked Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Product wording | Per-store `itemNounSingular`/`itemNounPlural` on `Store`; **no model/URL rename** |
| 2 | Model names | Stay `Book`/`Collection` internally (unchanged) |
| 3 | URL segment | Stays `/books/{slug}` (preserves bookstore URLs) |
| 4 | Money storage | Integer **minor units**; rename money fields `*Nis` → `*Minor` |
| 5 | Money formatting | `Intl.NumberFormat(locale, { style: "currency", currency })` per store |
| 6 | Existing data | One-time `×100` prod migration (shekels → agorot), rehearsed + backed up |
| 7 | Collections wording | Keep "مجموعة" for now; per-store bundle noun deferred |

## 3. Per-Store Wording

- Add `itemNounSingular String @default("منتج")` and
  `itemNounPlural String @default("منتجات")` to `Store`. The adopt/existing
  bookstore store is set to `"كتاب"` / `"كتب"`.
- A small helper resolves the nouns from the current store (admin: `getCurrentStore()`;
  storefront: the `[storeSlug]` context). UI text that currently hard-codes book
  words uses these instead — e.g. admin nav "الكتب", section headings, empty
  states, and storefront labels. Generic strings (e.g. "أضف إلى السلة") are left
  as-is.
- Scope note: this touches **copy only**, not model names, routes, or data access.

## 4. Multi-Currency Money

### 4.1 Field rename (money only)
Rename the integer money **columns** `*Nis` → `*Minor` on `Book` (`priceNis`),
`Collection` (`priceNis`), `Order` (`totalNis`, `discountNis`), `OrderItem`
(`unitPriceNis`), `OrderCollectionItem` (`unitPriceNis`), `Transaction`
(`amountNis`). Update every reference in `src/actions/*`, `src/lib/data.ts`,
`src/lib/payment-status.ts`, components, `src/lib/validations.ts`, and the order
email. Derived/computed names (`paidMinor`, `outstandingMinor`, `setPriceMinor`,
`totalDiscountMinor`) rename for consistency. Semantics stay integer; only the
unit interpretation changes (minor units).

### 4.2 Currency-aware formatting
- Replace the hard-coded `₪` in `src/components/ui/Price.tsx` and
  `src/lib/resend.ts` with a formatter: `formatMoney(minor, currency, locale)` →
  `Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100)`.
- Storefront/admin pass the store's `currency` + `defaultLocale`; the order email
  uses the order's store currency.
- `DEFAULT_PRICE_NIS` (constants) → `DEFAULT_PRICE_MINOR` (e.g. `4000` = 40.00).

### 4.3 One-time production migration
- Destructive in-place: `UPDATE` each money column `= value * 100`. Not nullable
  backfill — a value transform — so it must run **exactly once** against real
  data.
- **Playbook (same as the storeId migration):** `pg_dump` backup → restore into a
  throwaway local pg17 → run the `×100` migration on that real-data copy → verify
  totals/line items still reconcile → then run against prod, phased with the
  code deploy. A Prisma migration file carries the `×100 + rename` SQL so it is
  reproducible; on prod it runs via `npm run db:migrate` (separate from build).
- Idempotency guard: the migration must not double-apply (tie it to the Prisma
  migration history; never re-run the `×100` step manually).

## 5. Out of Scope (later)
- `Book`→`Product` / `Collection`→`Bundle` model, file, and URL renames.
- Per-store bundle/collection noun; per-store number-format overrides.
- Multi-currency *checkout* logic beyond display (no FX conversion — each store is
  single-currency).

## 6. Testing Focus
- **Money math intact after the rename:** order totals, discounts, payment status
  (`payment-status.ts`), stock/finance sums compute identically (just renamed).
- **Formatting:** `formatMoney(4000, "ILS", "ar")` and `formatMoney(4000, "USD", "en")`
  render the right symbol/decimals; `Price` component and email use it.
- **Migration correctness (highest priority):** on a copy of real prod data, every
  money value is exactly `×100` after migration, order line items still sum to
  order totals, and it is not double-applied.
- **Wording:** the bookstore renders "كتب"; a store with default nouns renders
  "منتجات"; no hard-coded book word remains in the touched UI.

## 7. Risks / Open Items
- **The `×100` migration is the main risk** — destructive value transform on live
  money. Mitigated by backup + real-data rehearsal + run-once discipline. This is
  the deploy step to treat with the most care.
- **Deploy couples Plan 4 + Plan 3:** production is still on Plans 1+2, so the next
  prod deploy ships Plan 4's routing AND Plan 3's money migration together —
  sequence: backup → migrate (`×100`) → `vercel --prod` → verify.
- **Field-rename breadth:** `*Nis` appears across schema, actions, lib, components,
  validations, and the email; the plan must rename them together so the app stays
  buildable, with the money-math tests as the backstop.
- Next.js 16 specifics already established; no new routing work here.
