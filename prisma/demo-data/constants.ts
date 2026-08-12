export const DEMO_USER = {
  email: "demo@demo.store",
  password: "demodemo1",
  name: "Demo Owner",
} as const;

export const DEMO_STORE = { slug: "demo", name: "Demo Bookshop" } as const;

export const PRNG_SEED = 20260812;
export const WINDOW_DAYS = 90;
export const ORDER_COUNT = 40;

// Deterministic per-book demo price (minor units, USD × 100). Demo-only; the
// real seed leaves priceMinor to the schema default.
export const DEMO_BOOK_PRICE_MINOR: Record<string, number> = {
  "stellas-solar-system": 1800,
  "tiny-seed-journey": 1500,
  "rusty-robot-bridge": 2200,
  "kitchen-science-lab": 2000,
  "great-shapes-mystery": 1600,
  "coding-with-cody": 1900,
  "amazing-human-machine": 2400,
  "wind-and-water": 1800,
  "meet-the-elements": 2100,
  "journey-to-earths-core": 1700,
  "junior-paleontologist": 2000,
  "busy-bees-big-job": 1500,
  "where-do-puddles-go": 1600,
  "deep-dive-ocean": 2200,
};
