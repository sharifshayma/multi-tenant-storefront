// Supported store currencies (ISO 4217). Any code here is passed straight to
// Intl.NumberFormat for price display, so all must be valid ISO codes.
// Display names live in the i18n dictionaries under `currencies.<code>` (see
// src/i18n/dictionaries/ar.ts + en.ts) so they follow the store's uiLocale
// instead of being hard-coded to one language here.
export const CURRENCIES: { code: string }[] = [
  { code: "USD" },
  { code: "EUR" },
  { code: "GBP" },
  { code: "SAR" },
  { code: "AED" },
  { code: "QAR" },
  { code: "KWD" },
  { code: "BHD" },
  { code: "OMR" },
  { code: "JOD" },
  { code: "EGP" },
  { code: "ILS" },
  { code: "TRY" },
];

export const CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));
