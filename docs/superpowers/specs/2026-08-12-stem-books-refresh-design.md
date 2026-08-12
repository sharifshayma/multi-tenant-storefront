# Demo Catalog Refresh — STEM Children's Books

**Date:** 2026-08-12
**Status:** Approved

## Goal

Replace the demo storefront's 14 Arabic bilingual biography books with 14 English STEM children's books, update collections and prices, switch the demo store to English/LTR, and let orders/amounts/ledger regenerate deterministically from the new catalog.

## Scope

All changes are confined to the demo seed data + its tests. The real seed (`prisma/seed.ts`), schema, and app code are untouched. Orders, order line-items, collection line-items, transactions, and stock movements are **generated** from the catalog, so they update automatically on re-seed — no hand-editing.

## Books (14)

English-only `title`; USD price → `priceMinor` (USD × 100).

| Slug | Title | priceMinor |
|---|---|---|
| `stellas-solar-system` | Stella's Solar System Adventure | 1800 |
| `tiny-seed-journey` | The Tiny Seed's Big Journey | 1500 |
| `rusty-robot-bridge` | Rusty the Robot Builds a Bridge | 2200 |
| `kitchen-science-lab` | My First Kitchen Science Lab | 2000 |
| `great-shapes-mystery` | The Great Shapes Mystery | 1600 |
| `coding-with-cody` | Coding with Cody the Caterpillar | 1900 |
| `amazing-human-machine` | Inside the Amazing Human Machine | 2400 |
| `wind-and-water` | The Power of Wind and Water | 1800 |
| `meet-the-elements` | Meet the Elements: The Universe's Building Blocks | 2100 |
| `journey-to-earths-core` | Journey to the Core of the Earth | 1700 |
| `junior-paleontologist` | The Junior Paleontologist's Handbook | 2000 |
| `busy-bees-big-job` | The Busy Bee's Big Job | 1500 |
| `where-do-puddles-go` | Where Do Puddles Go? A Book About Weather | 1600 |
| `deep-dive-ocean` | Deep Dive: Zones of the Ocean | 2200 |

## Collections (4 themed + 1 custom)

| Slug | Title | Books | priceMinor |
|---|---|---|---|
| `space-earth` | Space & Earth Explorers | solar-system, earths-core, puddles, deep-dive-ocean | 6400 |
| `living-world` | The Living World | tiny-seed, human-machine, busy-bees, junior-paleontologist | 6400 |
| `build-code` | Build & Code | rusty-robot, shapes-mystery, coding-with-cody | 4900 |
| `hands-on-science` | Hands-On Science Lab | kitchen-science, meet-the-elements, wind-and-water | 5200 |
| `build-your-own` (custom) | Build Your Own Bundle — Pick Any 5 | any 5 | 8000 |

## Other changes

- **Locale:** demo store `defaultLocale` `ar` → `en` in `prisma/seed-demo.ts`. Store name unchanged ("Demo Bookshop").
- **Covers:** `public/images/books/<slug>/cover.jpg` for each new slug. Old slug folders removed. Real cover images supplied by the user.
- **Tests:** `catalog.test.ts` bilingual-title assertion (`title.contains("|")`) replaced with an English-title check (non-empty, unique slugs, 14 books). Order/ledger tests are invariant-based and need no change.

## Verification

- `vitest` green on `prisma/demo-data/__tests__`.
- `tsc --noEmit` clean.
- `npm run seed:demo` against a local DB completes and produces 14 books, 5 collections, 40 orders.

## Out of scope

App UI, real seed, schema, deployment. User re-seeds/deploys the live demo.
