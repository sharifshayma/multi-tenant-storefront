import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { getCurrentUser } from "@/lib/auth-guard";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { dirFor, type Locale } from "@/i18n";
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
  const locale = (store?.uiLocale ?? "ar") as Locale;

  return (
    <LocaleProvider locale={locale}>
      <div dir={dirFor(locale)} lang={locale} className="min-h-screen">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/admin" className="shrink-0 font-extrabold text-brand">
              لوحة التحكم
            </Link>
            <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto whitespace-nowrap text-sm font-bold text-muted">
              <Link href="/admin/orders" className="shrink-0 hover:text-ink">
                الطلبات
              </Link>
              <Link href="/admin/books" className="shrink-0 hover:text-ink">
                ال{plural} والوسائط
              </Link>
              <Link href="/admin/collections" className="shrink-0 hover:text-ink">
                المجموعات
              </Link>
              <Link href="/admin/finance" className="shrink-0 hover:text-ink">
                المالية
              </Link>
              <Link href="/admin/stock" className="shrink-0 hover:text-ink">
                المخزون
              </Link>
              <Link href="/admin/settings" className="shrink-0 hover:text-ink">
                الإعدادات
              </Link>
            </nav>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </LocaleProvider>
  );
}
