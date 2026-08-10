"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useT } from "@/i18n/LocaleProvider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useT();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink"
    >
      <LogOut className="h-4 w-4" />
      {t("admin.nav.logout")}
    </button>
  );
}
