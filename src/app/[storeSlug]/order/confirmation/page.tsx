import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resolveStorefrontContext, storeHref } from "@/lib/storefront-context";
import { getDictionary, t, type Locale } from "@/i18n";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const ctx = await resolveStorefrontContext({ slugParam: storeSlug, host });
  if (!ctx) notFound();
  const d = getDictionary(ctx.store.uiLocale as Locale);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <CheckCircle2 className="mx-auto h-16 w-16 text-brand" />
      <h1 className="mt-4 text-2xl font-extrabold">{t(d, "store.confirmation.title")}</h1>
      <p className="mt-3 text-muted">{t(d, "store.confirmation.message")}</p>
      <Link href={storeHref(ctx.basePath, "/")} className="mt-8 inline-block">
        <Button variant="ghost">{t(d, "store.backToStore")}</Button>
      </Link>
    </div>
  );
}
