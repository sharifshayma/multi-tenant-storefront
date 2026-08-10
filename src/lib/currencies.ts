// Supported store currencies (ISO 4217). Any code here is passed straight to
// Intl.NumberFormat for price display, so all must be valid ISO codes.
export const CURRENCIES: { code: string; label: string }[] = [
  { code: "USD", label: "دولار أمريكي (USD)" },
  { code: "EUR", label: "يورو (EUR)" },
  { code: "GBP", label: "جنيه إسترليني (GBP)" },
  { code: "SAR", label: "ريال سعودي (SAR)" },
  { code: "AED", label: "درهم إماراتي (AED)" },
  { code: "QAR", label: "ريال قطري (QAR)" },
  { code: "KWD", label: "دينار كويتي (KWD)" },
  { code: "BHD", label: "دينار بحريني (BHD)" },
  { code: "OMR", label: "ريال عماني (OMR)" },
  { code: "JOD", label: "دينار أردني (JOD)" },
  { code: "EGP", label: "جنيه مصري (EGP)" },
  { code: "ILS", label: "شيكل (ILS)" },
  { code: "TRY", label: "ليرة تركية (TRY)" },
];

export const CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));
