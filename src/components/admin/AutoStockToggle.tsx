"use client";

import { useState, useTransition } from "react";
import { updateAutoStockSetting } from "@/actions/settings";
import { cn } from "@/lib/utils";

export function AutoStockToggle({
  enabled: initialEnabled,
  itemNounPlural,
}: {
  enabled: boolean;
  itemNounPlural: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(() => {
      updateAutoStockSetting(next);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-extrabold">تحديث المخزون تلقائياً</h2>
        <p className="mt-1 text-sm text-muted">
          عند نقل الطلب إلى «تم الشحن» أو «تم التسليم»، تُخصم ال{itemNounPlural} المطلوبة من المخزون تلقائياً.
          يُخصم الطلب مرة واحدة فقط حتى لو مرّ بالحالتين. عند الإيقاف، يمكنك تعديل المخزون يدوياً من صفحة المخزون.
        </p>
        <p className="mt-2 text-xs font-bold">
          الحالة الآن:{" "}
          <span className={enabled ? "text-accent" : "text-muted"}>
            {enabled ? "مُفعّل" : "متوقف"}
          </span>
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="تحديث المخزون تلقائياً"
        disabled={pending}
        onClick={toggle}
        className={cn(
          "relative mt-1 inline-block h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50",
          enabled ? "bg-accent" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            // Absolute left/right so the knob position is unambiguous in RTL:
            // "on" rests at the right end, "off" at the left end.
            enabled ? "right-1" : "left-1"
          )}
        />
      </button>
    </div>
  );
}
