import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { getCurrentUser } from "@/lib/auth-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen">
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
              الكتب والوسائط
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
  );
}
