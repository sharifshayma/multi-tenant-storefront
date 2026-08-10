"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoreCurrency } from "@/actions/store";
import { CURRENCIES } from "@/lib/currencies";
import { useT } from "@/i18n/LocaleProvider";

export function CurrencyCard({ currency }: { currency: string }) {
  const router = useRouter();
  const { t } = useT();
  const [value, setValue] = useState(currency);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await updateStoreCurrency(value);
      if (r.ok) {
        setMsg({ ok: true, text: t("admin.settings.currency.saved") });
        router.refresh();
      } else {
        setMsg({ ok: false, text: r.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">{t("admin.settings.currency.heading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("admin.settings.currency.description")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-brand"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || value === currency}
          onClick={save}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : t("common.save")}
        </button>
      </div>
      {msg && (
        <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
