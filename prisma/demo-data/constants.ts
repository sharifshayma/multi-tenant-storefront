export const DEMO_USER = {
  email: "demo@demo.store",
  password: "demodemo1",
  name: "Demo Owner",
} as const;

export const DEMO_STORE = { slug: "demo", name: "Demo Bookshop" } as const;

export const PRNG_SEED = 20260812;
export const WINDOW_DAYS = 90;
export const ORDER_COUNT = 40;

// Deterministic per-book demo price (minor units). Demo-only; the real
// seed leaves priceMinor to the schema default.
export const DEMO_BOOK_PRICE_MINOR: Record<string, number> = {
  "amal-clooney": 4500,
  "huda-kattan": 4000,
  "mo-salah": 3500,
  "zaha-hadid": 5000,
  "farouk-el-baz": 4000,
  "salem-saleh": 3500,
  "yusra-mardini": 4500,
  "rami-malek": 4000,
  "hazza-al-mansouri": 5000,
  "omar-yaghi": 4500,
  "rama-duwaji": 4000,
  "amjad-massad": 3500,
  "edward-said": 5500,
  "achraf-hakimi": 4000,
};
