import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { NewBookForm } from "@/components/admin/NewBookForm";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { storefrontUrls } from "@/lib/store-url";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { singular, plural } = storeNoun(store);
  // e.g. "store.thatsmy.app/make-up/books/" — shown before the slug input so
  // the field reads as a real URL the user just completes.
  const urlPrefix = `${storefrontUrls(store).platform.replace(/^https?:\/\//, "")}/books/`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/books"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى ال{plural}
      </Link>

      <h1 className="text-2xl font-extrabold">إضافة {singular} جديد</h1>

      <NewBookForm itemNounSingular={singular} currency={store.currency} urlPrefix={urlPrefix} />
    </div>
  );
}
