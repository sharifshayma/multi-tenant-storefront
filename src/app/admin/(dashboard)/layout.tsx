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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-extrabold text-brand">
              لوحة التحكم
            </Link>
            <nav className="flex items-center gap-4 text-sm font-bold text-muted">
              <Link href="/admin/orders" className="hover:text-ink">
                الطلبات
              </Link>
              <Link href="/admin/books" className="hover:text-ink">
                الكتب والوسائط
              </Link>
              <Link href="/admin/collections" className="hover:text-ink">
                المجموعات
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
