import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { getCurrentUser } from "@/lib/auth-guard";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { getDictionary, t, dirFor, type Locale } from "@/i18n";
import { LocaleProvider } from "@/i18n/LocaleProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const store = await getCurrentStore();
  const { plural } = store ? storeNoun(store) : { plural: "منتجات" };
  const locale = (store?.uiLocale ?? "en") as Locale;
  const d = getDictionary(locale);

  return (
    <LocaleProvider locale={locale}>
      <div dir={dirFor(locale)} lang={locale} className="min-h-screen">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/admin" className="shrink-0 font-extrabold text-brand">
              {t(d, "admin.nav.dashboard")}
            </Link>
            <AdminNav plural={plural} />
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </LocaleProvider>
  );
}
