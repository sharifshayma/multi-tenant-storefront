import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { NewCollectionForm } from "@/components/admin/NewCollectionForm";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { storefrontUrls } from "@/lib/store-url";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { plural } = storeNoun(store);
  const d = getDictionary(store.uiLocale as Locale);
  const urlPrefix = `${storefrontUrls(store).platform.replace(/^https?:\/\//, "")}/collections/`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/collections"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        {t(d, "admin.collections.backToCollections")}
      </Link>

      <h1 className="text-2xl font-extrabold">{t(d, "admin.collections.createNewTitle")}</h1>

      <NewCollectionForm itemNounPlural={plural} currency={store.currency} urlPrefix={urlPrefix} />
    </div>
  );
}
