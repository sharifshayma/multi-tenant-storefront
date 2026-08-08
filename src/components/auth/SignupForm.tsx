"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUpAndCreateStore } from "@/actions/signup";
import { signupSchema } from "@/lib/validations";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({ email, password, storeName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
      return;
    }

    setSubmitting(true);
    const result = await signUpAndCreateStore(parsed.data);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h1 className="text-center text-xl font-extrabold">إنشاء متجر جديد</h1>
      <Input
        id="storeName"
        type="text"
        label="اسم المتجر"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        autoComplete="organization"
        required
        autoFocus
      />
      <Input
        id="email"
        type="email"
        label="البريد الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        id="password"
        type="password"
        label="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "جارِ الإنشاء..." : "إنشاء الحساب"}
      </Button>
      <p className="text-center text-sm text-ink/60">
        لديك حساب بالفعل؟{" "}
        <Link href="/admin/login" className="font-bold text-brand hover:underline">
          دخول
        </Link>
      </p>
    </form>
  );
}
