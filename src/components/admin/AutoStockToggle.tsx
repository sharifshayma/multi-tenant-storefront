"use client";

import { useState, useTransition } from "react";
import { updateAutoStockSetting } from "@/actions/settings";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LocaleProvider";

export function AutoStockToggle({
  enabled: initialEnabled,
  itemNounPlural,
}: {
  enabled: boolean;
  itemNounPlural: string;
}) {
  const { t } = useT();
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
        <h2 className="font-extrabold">{t("admin.settings.autoStock.heading")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("admin.settings.autoStock.description", { plural: itemNounPlural })}
        </p>
        <p className="mt-2 text-xs font-bold">
          {t("admin.settings.autoStock.statusNow")}{" "}
          <span className={enabled ? "text-accent" : "text-muted"}>
            {enabled ? t("admin.settings.autoStock.enabled") : t("admin.settings.autoStock.disabled")}
          </span>
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t("admin.settings.autoStock.heading")}
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
