import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
