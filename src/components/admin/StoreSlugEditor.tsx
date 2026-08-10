"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSlug } from "@/actions/store";

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
        setMsg({ ok: true, text: "تم تحديث العنوان" });
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
        تغيير العنوان يوقف عمل أي روابط قديمة على المنصة شاركتِها سابقاً. رابط النطاق المخصص لا يتأثر.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span dir="ltr" className="text-sm text-muted">{origin}</span>
        <input
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border px-3 py-1.5 text-sm font-bold"
        />
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : "حفظ"}
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
