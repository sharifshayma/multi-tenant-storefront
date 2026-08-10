"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoreUiLocale } from "@/actions/store";
import { useT } from "@/i18n/LocaleProvider";

// Native names — intentionally NOT translated: a language picker shows each
// language in its own script, not the current UI language.
const LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];

export function LanguageCard({ uiLocale }: { uiLocale: string }) {
  const router = useRouter();
  const { t } = useT();
  const [value, setValue] = useState(uiLocale);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await updateStoreUiLocale(value);
      if (r.ok) {
        setMsg(t("admin.settings.language.saved"));
        router.refresh();
      } else {
        setMsg(r.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">{t("admin.settings.language.heading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("admin.settings.language.description")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-brand"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || value === uiLocale}
          onClick={save}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : t("common.save")}
        </button>
      </div>
      {msg && <p className="text-sm font-bold text-accent">{msg}</p>}
    </div>
  );
}
