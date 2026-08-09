import { redirect } from "next/navigation";
import { getAutoStockEnabled } from "@/lib/settings";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { storefrontUrls } from "@/lib/store-url";
import { AutoStockToggle } from "@/components/admin/AutoStockToggle";
import { StorefrontLinkCard } from "@/components/admin/StorefrontLinkCard";
import { StoreSlugEditor } from "@/components/admin/StoreSlugEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { plural } = storeNoun(store);
  const autoStockEnabled = await getAutoStockEnabled(store.id);
  const urls = storefrontUrls(store);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">الإعدادات</h1>

      <StorefrontLinkCard platform={urls.platform} customDomain={urls.customDomain} />
      <StoreSlugEditor slug={store.slug} platform={urls.platform} />

      <div className="rounded-2xl border border-border bg-white p-5">
        <AutoStockToggle enabled={autoStockEnabled} itemNounPlural={plural} />
      </div>
    </div>
  );
}
