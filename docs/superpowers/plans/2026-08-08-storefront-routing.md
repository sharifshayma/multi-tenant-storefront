# Storefront Routing & Platform Landing (Plan 4 of 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every store a reachable public storefront at `store.thatsmy.app/{storeSlug}`, keep the bookstore on its bare `arabstories.shayma.me` URLs, and add a minimal platform landing page at `/`.

**Architecture:** Move the storefront routes under a dynamic `src/app/[storeSlug]/` segment resolved by slug. A single storefront-context helper resolves the store + a `basePath` (empty on a custom domain, `/{slug}` on the platform host) so links render bare on the custom domain and slugged on the platform. `proxy.ts` rewrites bare custom-domain paths to `/{slug}/…` using a **static domain→slug map** (proxy runs on the Edge and must not query the DB). No data migration.

**Tech Stack:** Next.js 16 (App Router dynamic segments + `proxy.ts` rewrites), Prisma 6 + Supabase Postgres, Better Auth, Vitest.

## Global Constraints

- **Next.js 16.2.10.** Proxy = the renamed middleware (`src/proxy.ts`); `NextResponse.rewrite(destination)` is available (confirmed in `node_modules/next/dist/server/web/spec-extension/response.d.ts`). **Proxy runs on the Edge — no Prisma / no DB fetch inside it** (per `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Verify any further proxy API against that doc before coding.
- **The live bookstore must keep its exact current URLs** on `arabstories.shayma.me` (`/`, `/books/{slug}`, `/cart`, `/checkout`, `/collections/{slug}`, `/order/confirmation`). This is the top compatibility requirement.
- `npm run build` clean and `npm test` green after every task.
- **No `Book`→`Product` rename, no money change** — Plan 3. URL segment stays `/books/`.
- No self-serve custom domains for other stores — the single bookstore custom domain is a static config entry.
- UI copy stays Arabic/RTL, consistent with existing components.
- Reserved store slugs already exist in `src/lib/store-slug.ts` (`RESERVED_SLUGS`); Next resolves static routes (`/admin`, `/login`, `/signup`, `/api`) before the dynamic `[storeSlug]`.

---

### Task 1: Custom-domain map + storefront-context helper

**Files:**
- Create: `src/lib/custom-domains.ts`
- Create: `src/lib/storefront-context.ts`
- Create: `src/lib/__tests__/custom-domains.test.ts`
- Create: `src/lib/__tests__/storefront-context.test.ts`

**Interfaces:**
- Consumes: `prisma`.
- Produces:
  - `DOMAIN_TO_STORE_SLUG: Record<string,string>` and `customDomainSlug(host: string): string | null`.
  - `resolveStorefrontContext(input: { slugParam: string | null; host: string }): Promise<{ store: Store; basePath: string } | null>` — `basePath` is `""` for a custom-domain host, `/{slug}` for the platform host; null when the store slug doesn't exist.
  - `storeHref(basePath: string, path: string): string` — joins basePath + an app-absolute path (path begins with `/`).

- [ ] **Step 1: Write failing tests for the custom-domain map**

Create `src/lib/__tests__/custom-domains.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { customDomainSlug } from "@/lib/custom-domains";

describe("customDomainSlug", () => {
  it("maps the bookstore domain to its slug", () => {
    expect(customDomainSlug("arabstories.shayma.me")).toBe("shaymas-books");
  });
  it("ignores port and case", () => {
    expect(customDomainSlug("ARABSTORIES.shayma.me:443")).toBe("shaymas-books");
  });
  it("returns null for the platform host", () => {
    expect(customDomainSlug("store.thatsmy.app")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test src/lib/__tests__/custom-domains.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the map**

Create `src/lib/custom-domains.ts`:
```ts
// Static custom-domain -> store slug map. Proxy runs on the Edge and cannot
// query the DB, so custom domains are configured here (mirrors Store.customDomain).
// Self-serve custom domains for other stores are out of scope (later plan).
export const DOMAIN_TO_STORE_SLUG: Record<string, string> = {
  "arabstories.shayma.me": "shaymas-books",
};

export function customDomainSlug(host: string): string | null {
  const clean = host.toLowerCase().split(":")[0].trim();
  return DOMAIN_TO_STORE_SLUG[clean] ?? null;
}
```

- [ ] **Step 4: Run to verify pass** — `npm test src/lib/__tests__/custom-domains.test.ts` → PASS.

- [ ] **Step 5: Write failing tests for the context helper**

Create `src/lib/__tests__/storefront-context.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const findUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { store: { findUnique } } }));
import { resolveStorefrontContext, storeHref } from "@/lib/storefront-context";

beforeEach(() => findUnique.mockReset());

describe("resolveStorefrontContext", () => {
  it("custom-domain host: basePath empty, store from the domain's slug", async () => {
    findUnique.mockResolvedValue({ id: "s1", slug: "shaymas-books" });
    const ctx = await resolveStorefrontContext({ slugParam: "shaymas-books", host: "arabstories.shayma.me" });
    expect(ctx).toEqual({ store: { id: "s1", slug: "shaymas-books" }, basePath: "" });
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: "shaymas-books" } });
  });
  it("platform host: basePath is /{slug}", async () => {
    findUnique.mockResolvedValue({ id: "s2", slug: "janes-crafts" });
    const ctx = await resolveStorefrontContext({ slugParam: "janes-crafts", host: "store.thatsmy.app" });
    expect(ctx).toEqual({ store: { id: "s2", slug: "janes-crafts" }, basePath: "/janes-crafts" });
  });
  it("returns null when the store slug does not exist", async () => {
    findUnique.mockResolvedValue(null);
    expect(await resolveStorefrontContext({ slugParam: "nope", host: "store.thatsmy.app" })).toBeNull();
  });
});

describe("storeHref", () => {
  it("joins basePath and path", () => {
    expect(storeHref("/janes-crafts", "/cart")).toBe("/janes-crafts/cart");
    expect(storeHref("", "/cart")).toBe("/cart");
  });
});
```

- [ ] **Step 6: Run to verify failure** — FAIL (module not found).

- [ ] **Step 7: Implement the context helper**

Create `src/lib/storefront-context.ts`:
```ts
import { prisma } from "@/lib/prisma";
import { customDomainSlug } from "@/lib/custom-domains";
import type { Store } from "@prisma/client";

export function storeHref(basePath: string, path: string): string {
  return `${basePath}${path}`;
}

export async function resolveStorefrontContext(input: {
  slugParam: string | null;
  host: string;
}): Promise<{ store: Store; basePath: string } | null> {
  const domainSlug = customDomainSlug(input.host);
  const slug = domainSlug ?? input.slugParam;
  if (!slug) return null;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return null;
  const basePath = domainSlug ? "" : `/${store.slug}`;
  return { store, basePath };
}
```

- [ ] **Step 8: Run to verify pass, then full suite** — `npm test` → all green.

- [ ] **Step 9: Commit**

```bash
git add src/lib/custom-domains.ts src/lib/storefront-context.ts src/lib/__tests__/custom-domains.test.ts src/lib/__tests__/storefront-context.test.ts
git commit -m "feat(routing): add custom-domain map and storefront-context helper"
```

---

### Task 2: Move the storefront under `/[storeSlug]` and store-scope its links

**Files:**
- Move: `src/app/(site)/**` → `src/app/[storeSlug]/**` (home `page.tsx`, `books/[slug]/page.tsx`, `cart/page.tsx`, `collections/[slug]/page.tsx`, `order/confirmation/page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`)
- Modify: those pages to resolve the store via `resolveStorefrontContext` using the route's `storeSlug` param + the request `Host` (`await headers()`), `notFound()` when null, and pass `store.id` into `data.ts` readers
- Modify: storefront components that build links (`src/components/storefront/SiteHeader.tsx`, `BookCard.tsx`, `CollectionCard.tsx`, `CartIcon.tsx`, `AddToCartButton.tsx`, `AddCollectionToCartButton.tsx`, `BundleBuilder.tsx`, and the cart/confirmation pages) to prefix links with `basePath`

**Interfaces:**
- Consumes: `resolveStorefrontContext`, `storeHref` (Task 1); `getBooks`/`getBookBySlug`/`getCollections`/`getCollectionBySlug` (now store-scoped, from Plan 2).
- Produces: storefront served at `/[storeSlug]/…`; every internal storefront link built with `basePath` so it is bare on a custom domain and slugged on the platform host.

- [ ] **Step 1: Relocate the routes**

```bash
git mv "src/app/(site)" "src/app/[storeSlug]"
```
Next now serves the former `/` at `/[storeSlug]`, `/books/x` at `/[storeSlug]/books/x`, etc.

- [ ] **Step 2: Resolve the store in the `[storeSlug]` layout/pages**

In each `[storeSlug]` page (and where a page needs the store), read the params + host and resolve context. Pattern (home page shown; apply the same resolution to every storefront page):
```tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export default async function StoreHome({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const books = await getBooks(ctx.store.id);
  // ...render, passing ctx.basePath to child components/links
}
```
Do the same in `books/[slug]/page.tsx`, `collections/[slug]/page.tsx`, `cart/page.tsx`, `order/confirmation/page.tsx`. Pass `ctx.basePath` down to any component that renders a link.

- [ ] **Step 3: Store-scope every storefront link**

Replace hard-coded link targets with `storeHref(basePath, …)`. Example in `BookCard.tsx`: `href={storeHref(basePath, `/books/${book.slug}`)}` instead of `href={`/books/${book.slug}`}`. Add a `basePath: string` prop to each linking component (`SiteHeader`, `BookCard`, `CollectionCard`, `CartIcon`, add-to-cart buttons, cart/confirmation pages) and thread it from the page. The site logo/home link becomes `storeHref(basePath, "/")`.

- [ ] **Step 4: Build + full suite**

Run: `npm run build && npm test`
Expected: clean build; storefront routes compile under `[storeSlug]`; tests green. (`/` now 404s until Task 3 — that is expected at this step.)

- [ ] **Step 5: Manual check**

`npm run dev`; visit `http://localhost:3000/shaymas-books` → the bookstore's books render; click a book → `/shaymas-books/books/<slug>`; the cart link stays under `/shaymas-books`. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/app/\[storeSlug\] src/components/storefront
git commit -m "feat(routing): serve storefront under /[storeSlug] with store-scoped links"
```

---

### Task 3: Platform landing page at `/`

**Files:**
- Create: `src/app/page.tsx` (platform landing)
- Create: `src/app/layout.tsx` additions only if needed (root layout already exists — do not duplicate `<html>`)

**Interfaces:**
- Consumes: nothing store-specific.
- Produces: the platform landing at `/` on the platform host.

- [ ] **Step 1: Build the landing page**

Create `src/app/page.tsx` — a minimal server component: platform name/tagline (Arabic/RTL), one line on what it is, a primary link **"أنشئ متجرك"** → `/signup`, and a "تسجيل الدخول" link → `/admin/login`. Reuse existing UI primitives (`Button`) and brand styles. No store data.

- [ ] **Step 2: Build + confirm `/` renders the landing**

Run: `npm run build`. Then `npm run dev`; visit `http://localhost:3000/` → landing page (not a store); the "Create your store" button links to `/signup`. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(routing): add minimal platform landing page at /"
```

---

### Task 4: Proxy — rewrite bare custom-domain paths to `/{slug}`

**Files:**
- Modify: `src/proxy.ts`
- Create: `src/lib/__tests__/proxy-rewrite.test.ts` (unit-test the pure rewrite decision)

**Interfaces:**
- Consumes: `customDomainSlug` (Task 1).
- Produces: on a custom-domain host, bare storefront paths are internally rewritten to `/{slug}/…` (so the bookstore keeps bare URLs); admin/api/platform paths and the platform host are untouched.

- [ ] **Step 1: Extract a pure decision function + failing test**

Create `src/lib/__tests__/proxy-rewrite.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { storefrontRewritePath } from "@/lib/custom-domains";

describe("storefrontRewritePath", () => {
  it("rewrites a bare custom-domain path to /{slug}/...", () => {
    expect(storefrontRewritePath("arabstories.shayma.me", "/books/x")).toBe("/shaymas-books/books/x");
    expect(storefrontRewritePath("arabstories.shayma.me", "/")).toBe("/shaymas-books");
  });
  it("does not rewrite admin/api paths on a custom domain", () => {
    expect(storefrontRewritePath("arabstories.shayma.me", "/admin/orders")).toBeNull();
    expect(storefrontRewritePath("arabstories.shayma.me", "/api/auth/x")).toBeNull();
  });
  it("does not rewrite on the platform host", () => {
    expect(storefrontRewritePath("store.thatsmy.app", "/janes-crafts")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL (function not exported).

- [ ] **Step 3: Implement `storefrontRewritePath`** in `src/lib/custom-domains.ts`:
```ts
export function storefrontRewritePath(host: string, pathname: string): string | null {
  const slug = customDomainSlug(host);
  if (!slug) return null;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) return null;
  return pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Wire it into `proxy.ts`**

Keep the existing admin session guard. Before it, add the custom-domain rewrite; broaden the matcher to run on page routes (excluding assets and `/api/auth`). New `src/proxy.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { storefrontRewritePath } from "@/lib/custom-domains";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Custom-domain storefront: rewrite bare paths to /{slug}/... (bookstore keeps bare URLs)
  const rewrite = storefrontRewritePath(host, pathname);
  if (rewrite) {
    return NextResponse.rewrite(new URL(rewrite, request.url));
  }

  // Admin guard (unchanged)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  return NextResponse.next();
}

// Runs on page + guarded API routes; excludes static assets and the public Better Auth endpoints.
// NOTE: /api/auth/* must remain public.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
```

- [ ] **Step 6: Build + full suite + manual custom-domain simulation**

Run: `npm run build && npm test`. Then `npm run dev` and simulate the custom-domain host:
```bash
curl -s -H "Host: arabstories.shayma.me" http://localhost:3000/ -o /dev/null -w "%{http_code}\n"
curl -s -H "Host: arabstories.shayma.me" http://localhost:3000/books/<a-real-slug> -o /dev/null -w "%{http_code}\n"
```
Expected: 200s (rewritten to the bookstore's store). Confirm `/admin` on that host still redirects to login. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/proxy.ts src/lib/custom-domains.ts src/lib/__tests__/proxy-rewrite.test.ts
git commit -m "feat(routing): rewrite bare custom-domain paths to the store slug"
```

---

### Task 5: Checkout resolves the store from its route context

**Files:**
- Modify: `src/actions/orders.ts` (`createOrder`)
- Modify: `src/app/[storeSlug]/cart/page.tsx` / the checkout submission path to pass the `storeSlug`
- Modify: `src/lib/cart-context.tsx` only if the store id/slug must be threaded to the action
- Create/Modify test: `src/actions/__tests__/create-order-store.test.ts`

**Interfaces:**
- Consumes: `resolveStorefrontContext` (or `customDomainSlug` + slug) to resolve the store for a checkout.
- Produces: `createOrder` stamps and scopes to the store the checkout happened under (path slug or custom domain), not just the oldest store.

- [ ] **Step 1: Write the failing test**

Create `src/actions/__tests__/create-order-store.test.ts`: mock `resolveStorefrontContext` to return store B for a given `{ slugParam, host }`; call `createOrder` with an input that carries the `storeSlug` (and mock `headers` for host); assert the order is created with `storeId: "B"` and that the book lookups filter by `storeId: "B"`. Add a case where the store can't be resolved → `{ ok: false }`.

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Update `createOrder`**

Change `createOrder(input)` so `input` includes `storeSlug` (the slug the storefront was rendered under). Resolve the store via `resolveStorefrontContext({ slugParam: input.storeSlug, host: (await headers()).get("host") ?? "" })`; if null return `{ ok: false, error: "المتجر غير متوفر" }`. Replace the current `findFirstOrThrow` oldest-store line. Keep the existing `storeId`-scoped book/collection lookups and the `order.create` stamping, now using this resolved `store.id`.

- [ ] **Step 4: Thread `storeSlug` from the storefront**

The cart/checkout UI already knows its `basePath`/slug (Task 2). Pass the current `storeSlug` into `createOrder` (add it to the `CheckoutInput` schema in `src/lib/validations.ts` and set it from the page's `storeSlug` param).

- [ ] **Step 5: Run tests + build**

Run: `npm test && npm run build` → green.

- [ ] **Step 6: Manual e2e**

`npm run dev`; on `http://localhost:3000/shaymas-books` add a book to the cart and complete checkout; confirm an order is created on the bookstore. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/actions/orders.ts src/app/\[storeSlug\] src/lib/validations.ts src/lib/cart-context.tsx src/actions/__tests__/create-order-store.test.ts
git commit -m "feat(routing): checkout resolves the store from its route context"
```

---

## Self-Review

**1. Spec coverage:** ✅ Path-based `/[storeSlug]` (Task 2); custom-domain bare URLs via proxy rewrite (Tasks 1+4); platform landing at `/` (Task 3); checkout follows the store (Task 5); reserved-slug precedence relied on (Global Constraints + existing `RESERVED_SLUGS`). Deferred items (rename, money, self-serve domains) are not tasks. ✅ Backward-compat (§6) is the explicit goal of Task 4 with a manual custom-domain curl check.

**2. Placeholder scan:** Novel logic (custom-domain map, context helper, proxy rewrite, checkout resolution) has real code + tests. The mechanical link-scoping in Task 2 Step 3 is specified as one `storeHref(basePath, …)` pattern applied to a named, exhaustive component list — actionable, not a placeholder.

**3. Type consistency:** `resolveStorefrontContext({slugParam, host})` returns `{store, basePath}` and is consumed identically in Tasks 2 and 5; `customDomainSlug(host)`/`storefrontRewritePath(host, pathname)` signatures match between their tests and `custom-domains.ts`; `storeHref(basePath, path)` is used consistently.

**4. Edge-safety:** the proxy imports only `customDomainSlug`/`storefrontRewritePath` (pure, no Prisma) — honoring the "no DB in proxy" constraint from the Next 16 docs. Store resolution that needs Prisma happens in pages/actions (Node runtime), never in `proxy.ts`.
