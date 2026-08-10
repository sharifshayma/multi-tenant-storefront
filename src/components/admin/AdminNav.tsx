"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const LINKS: { href: string; key: string; usePlural?: boolean }[] = [
  { href: "/admin/orders", key: "admin.nav.orders" },
  { href: "/admin/books", key: "admin.nav.itemsAndMedia", usePlural: true },
  { href: "/admin/collections", key: "admin.nav.collections" },
  { href: "/admin/finance", key: "admin.nav.finance" },
  { href: "/admin/stock", key: "admin.nav.stock" },
  { href: "/admin/settings", key: "admin.nav.settings" },
];

export function AdminNav({ plural }: { plural: string }) {
  const pathname = usePathname();
  const { t } = useT();

  // A link is active on its own page and any sub-page (e.g. /admin/orders/123).
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto whitespace-nowrap text-sm font-bold text-muted">
      {LINKS.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 pb-0.5",
              active ? "border-brand text-brand" : "border-transparent hover:text-ink"
            )}
          >
            {l.usePlural ? t(l.key, { plural }) : t(l.key)}
          </Link>
        );
      })}
    </nav>
  );
}
