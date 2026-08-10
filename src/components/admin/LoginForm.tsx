"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations";
import { useT } from "@/i18n/LocaleProvider";

export function LoginForm() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      // issue.message is an errors.* dictionary KEY (see lib/validations.ts).
      setError(t(parsed.error.issues[0]?.message ?? "auth.invalidData"));
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn.email({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(t("auth.login.invalidCredentials"));
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
      <h1 className="text-center text-xl font-extrabold">{t("auth.login.title")}</h1>
      <Input
        id="email"
        type="email"
        label={t("auth.login.email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        autoFocus
      />
      <Input
        id="password"
        type="password"
        label={t("auth.login.password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
      </Button>
      <p className="text-center text-sm text-ink/60">
        {t("auth.login.noStore")}{" "}
        <Link href="/signup" className="font-bold text-brand hover:underline">
          {t("auth.login.createStore")}
        </Link>
      </p>
    </form>
  );
}
