"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSlug } from "@/actions/store";
import { useT } from "@/i18n/LocaleProvider";

export function StoreSlugEditor({
  slug,
  platform,
  onSaved,
}: {
  slug: string;
  platform: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const origin = platform.slice(0, platform.length - slug.length); // e.g. "https://store.thatsmy.app/"
  const [value, setValue] = useState(slug);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await updateStoreSlug(value);
      if (r.ok) {
        setValue(r.slug);
        setMsg({ ok: true, text: t("admin.settings.slugEditor.saved") });
        router.refresh();
        onSaved?.();
      } else {
        setMsg({ ok: false, text: r.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {t("admin.settings.slugEditor.note")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div
          dir="ltr"
          className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        >
          <span className="flex items-center whitespace-nowrap bg-paper px-2.5 text-sm text-muted">
            {origin}
          </span>
          <input
            dir="ltr"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-w-0 flex-1 bg-white px-2.5 py-1.5 text-sm font-bold text-ink outline-none"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
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
