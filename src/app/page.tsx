import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "أنشئ متجرك الإلكتروني",
  description: "سجّل، أنشئ متجرك، وابدأ باستقبال الطلبات.",
};

export default function PlatformLandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          أنشئ متجرك الإلكتروني
        </h1>
        <p className="text-muted">
          سجّل، أنشئ متجرك، وابدأ باستقبال الطلبات.
        </p>
        <Link href="/signup" className="w-full">
          <Button size="lg" className="w-full">
            أنشئ متجرك
          </Button>
        </Link>
        <Link
          href="/admin/login"
          className="text-sm font-bold text-brand hover:underline"
        >
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
