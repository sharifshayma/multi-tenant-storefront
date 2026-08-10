"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Price } from "@/components/ui/Price";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LocaleProvider";
import type { ForecastedRevenueOrder } from "@/lib/data";

export function ForecastedRevenuePanel({
  totalMinor,
  orders,
  currency,
  locale,
}: {
  totalMinor: number;
  orders: ForecastedRevenueOrder[];
  currency: string;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  return (
    <div className="rounded-2xl border-2 border-gold/40 bg-gold/10 p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={orders.length === 0}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-start disabled:cursor-default"
      >
        <div>
          <h2 className="font-extrabold">{t("admin.finance.forecast.heading")}</h2>
          <p className="text-sm text-muted">{t("admin.finance.forecast.subtitle")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white">
            <Price minor={totalMinor} currency={currency} locale={locale} />
          </span>
          {orders.length > 0 && (
            <ChevronDown
              className={cn("h-5 w-5 text-muted transition-transform", open && "rotate-180")}
            />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto pe-1">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-3 text-sm hover:shadow-sm"
            >
              <span className="font-bold text-brand">{o.customerName}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={o.status} />
                <Price
                  minor={o.outstandingMinor}
                  currency={currency}
                  locale={locale}
                  className="font-extrabold text-brand"
                />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
