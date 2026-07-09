"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink"
    >
      <LogOut className="h-4 w-4" />
      خروج
    </button>
  );
}
