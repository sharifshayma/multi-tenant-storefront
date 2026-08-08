import { redirect } from "next/navigation";
import { getAutoStockEnabled } from "@/lib/settings";
import { getCurrentStore } from "@/lib/store-context";
import { AutoStockToggle } from "@/components/admin/AutoStockToggle";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");

  const autoStockEnabled = await getAutoStockEnabled(store.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">الإعدادات</h1>

      <div className="rounded-2xl border border-border bg-white p-5">
        <AutoStockToggle enabled={autoStockEnabled} />
      </div>
    </div>
  );
}
