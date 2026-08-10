"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUpAndCreateStore } from "@/actions/signup";
import { signupSchema } from "@/lib/validations";
import { useT } from "@/i18n/LocaleProvider";

export function SignupForm() {
  const router = useRouter();
  const { t } = useT();
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
      // issue.message is an errors.*/admin.* dictionary KEY (see lib/validations.ts).
      setError(t(parsed.error.issues[0]?.message ?? "auth.invalidData"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUpAndCreateStore(parsed.data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(t("auth.signup.unexpectedError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h1 className="text-center text-xl font-extrabold">{t("auth.signup.title")}</h1>
      <Input
        id="storeName"
        type="text"
        label={t("auth.signup.storeName")}
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        autoComplete="organization"
        required
        autoFocus
      />
      <Input
        id="email"
        type="email"
        label={t("auth.signup.email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        id="password"
        type="password"
        label={t("auth.signup.password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? t("auth.signup.submitting") : t("auth.signup.submit")}
      </Button>
      <p className="text-center text-sm text-ink/60">
        {t("auth.signup.hasAccount")}{" "}
        <Link href="/admin/login" className="font-bold text-brand hover:underline">
          {t("auth.signup.login")}
        </Link>
      </p>
    </form>
  );
}
