// Usage: npx tsx scripts/backfill-branding.ts <store-slug>
// Sets the original book store's branding to its previously-hardcoded values so
// its storefront is unchanged after per-store branding ships. Idempotent.
import { prisma } from "@/lib/prisma";

const NAME = "جذور عربية، أجنحة عالمية";
const HERO_SUBTITLE =
  "سلسلة كتب أطفال ثنائية اللغة (عربي-إنجليزي)، تروي قصص شخصيات عربية ألهمت العالم. أضيفي الكتب إلى سلتك واملئي بياناتك، وسنتواصل معك هاتفياً لتنسيق التوصيل والدفع.";
const FOOTER_TEXT =
  "جذور عربية، أجنحة عالمية — سلسلة كتب أطفال ثنائية اللغة\nنتواصل معك هاتفياً بعد إتمام الطلب لتنسيق التوصيل والدفع";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    throw new Error("Usage: npx tsx scripts/backfill-branding.ts <store-slug>");
  }
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    throw new Error(`No store with slug "${slug}"`);
  }
  await prisma.store.update({
    where: { id: store.id },
    data: {
      name: NAME,
      heroSubtitle: HERO_SUBTITLE,
      footerText: FOOTER_TEXT,
      // heroTitle/logo/colors left as-is (null): heroTitle falls back to name,
      // colors fall back to the defaults that already match.
    },
  });
  console.log(`Backfilled branding for "${slug}".`);
}

// Only run when invoked directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith("backfill-branding.ts")) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
