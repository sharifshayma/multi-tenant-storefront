# Plan 4 — Per-Store Storefront Routing & Platform Landing

**Date:** 2026-08-08
**Status:** Approved (design) — pending spec review before implementation plan
**Parent design:** [multi-store foundation](2026-08-08-multi-store-foundation-design.md)
**Predecessors:** Plan 1 (Accounts), Plan 2 (Store tenancy + signup) — both live in production

---

## 1. Goal

Give **every** store a reachable public storefront so a newly signed-up owner's
shop actually works for customers — not just the one bookstore. Add a real
platform landing page. No data migration.

Today's limitation: `resolveStorefrontStore(host)` (Plan 2) resolves a storefront
only by **custom domain**, falling back to the oldest store (tenant #1). A new
store from signup has no custom domain, so it is **unreachable by any URL**. Plan
4 adds **path-based routing** (`store.thatsmy.app/{storeSlug}`) so all stores are
reachable, while keeping the bookstore on its bare custom-domain URLs.

This is Plan 4 of 4 in the foundation. No `Book`→`Product` rename and no money
change — those remain **Plan 3**.

## 2. Locked Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Store URLs | **Path-based** `store.thatsmy.app/{storeSlug}/…` for all stores |
| 2 | Custom domain | Bookstore stays on **bare** `arabstories.shayma.me/…` via proxy rewrite |
| 3 | Platform landing | **Minimal** page at `/` (headline + "Create your store" CTA) |
| 4 | Product URL segment | Stays `/books/` (rename is Plan 3) |
| 5 | Self-serve custom domains for other stores | **Out of scope** (later add-on) |
| 6 | Data migration | **None** — routing + a landing page only |

## 3. Routing Architecture

Three request classes, resolved by host + path:

| Class | Example | Store resolved from |
|-------|---------|---------------------|
| Platform | `store.thatsmy.app/`, `/login`, `/signup`, `/admin` | none (or session for admin) |
| Storefront (path) | `store.thatsmy.app/{storeSlug}`, `/{storeSlug}/books/{slug}`, `/{storeSlug}/cart`, `/{storeSlug}/checkout` | the `{storeSlug}` path segment |
| Storefront (custom domain) | `arabstories.shayma.me/`, `/books/{slug}`, `/cart` | the request Host → `Store.customDomain` |

### 3.1 App Router structure
- Move the current `src/app/(site)/**` storefront routes under a dynamic
  segment **`src/app/[storeSlug]/**`** (home, `books/[slug]`, `cart`,
  `checkout`, `order/confirmation`, `collections/[slug]`).
- Add a **platform landing page** at `src/app/(platform)/page.tsx` (or
  `src/app/page.tsx`) served at `/`.
- Existing platform routes (`/login`, `/signup`, `/admin`) are unchanged and
  take precedence over the dynamic `[storeSlug]` (Next resolves static segments
  first; reserved slugs in `RESERVED_SLUGS` guarantee no collision).

### 3.2 `proxy.ts` host handling (the "two doors")
- **Custom-domain host** (request Host matches a `Store.customDomain`, e.g.
  `arabstories.shayma.me`): rewrite the incoming bare path to the store's routes
  internally — `/` → `/{storeSlug}`, `/books/x` → `/{storeSlug}/books/x`, etc. —
  so the bookstore keeps its exact current URLs. The slug is never shown.
- **Platform host** (`store.thatsmy.app` and the `*.vercel.app` URL): no rewrite;
  the `/{storeSlug}` path is used directly, and `/` is the platform landing.
- Admin guarding (`/admin`) is unchanged from Plan 1/2.

> **Next.js 16 note:** the exact App Router dynamic-segment + `proxy.ts` rewrite
> APIs must be confirmed against the installed Next 16 before coding, per
> `AGENTS.md`. This is where the breaking-change risk concentrates.

## 4. Store Resolution

- **Path-based:** the `[storeSlug]` layout/pages resolve the store via
  `prisma.store.findUnique({ where: { slug } })`; unknown slug → `notFound()`.
- **Custom-domain:** the proxy resolves Host → `Store.customDomain` and rewrites
  to that store's slug (reusing/refactoring Plan 2's `resolveStorefrontStore`).
- **Checkout:** `createOrder` resolves the store from the same context (the slug
  the request is under, or the custom-domain store) and scopes item lookups to it
  — extends Plan 2's host-only resolution to cover the path case.

## 5. Platform Landing Page (`/`)
Minimal: platform name/tagline, a short "what this is," and a primary
**"Create your store"** button → `/signup`, plus a "log in" link. Arabic/RTL
consistent with the rest of the app. Replaces today's fallback-to-tenant-#1
behavior at `/`.

## 6. Backward Compatibility (must not break the live bookstore)
- `arabstories.shayma.me` and all its current paths keep working via the
  custom-domain rewrite (§3.2). This is the highest-priority compatibility
  requirement — the bookstore is live.
- Internal links in the storefront components must become store-relative (build
  URLs under the current `{storeSlug}` / current host), not hard-coded to `/`.

## 7. Out of Scope (later)
- `Book`→`Product` / `Collection`→`Bundle` rename + money-to-minor-units (Plan 3).
- Self-serve custom domains for non-tenant-#1 stores.
- Per-store branding (logo/colors), themes, SEO metadata per store.
- A richer marketing landing page.

## 8. Testing Focus
- **Routing:** `/{storeSlug}` renders that store's products; a second store's
  slug renders *its* products (isolation via the store id from the slug); unknown
  slug → 404; reserved slugs (`admin`, `signup`, …) never resolve as a store.
- **Custom-domain rewrite:** a request with Host `arabstories.shayma.me` and path
  `/books/x` resolves to tenant #1 and renders as if at `/{tenant1Slug}/books/x`;
  the bookstore's existing URLs are unchanged.
- **Checkout:** an order placed under `/{storeSlug}/checkout` (or on the custom
  domain) is created on the correct store with items scoped to it.
- **Landing:** `/` on the platform host renders the landing page (not a store).

## 9. Risks / Open Items
- **Next.js 16 routing/proxy specifics** — verify against installed source before
  coding (`AGENTS.md`); the middleware→`proxy.ts` rewrite behavior is the main
  unknown.
- **Bookstore URL preservation** — the custom-domain rewrite must be exact; cover
  it with a test and a manual check against the live paths before deploy.
- **Internal link construction** — every storefront link must be store-scoped;
  a missed hard-coded `/` link would break navigation on the custom domain or
  cross into the wrong store on the platform host.
- Deploy is code-only (no migration); ships via the normal `vercel --prod`.
