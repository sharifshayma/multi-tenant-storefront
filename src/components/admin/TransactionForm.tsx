"use client";

import { useState } from "react";
import { createTransaction } from "@/actions/finance";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format-money";
import { minorToInput, inputToMinor } from "@/lib/money-input";
import { useT } from "@/i18n/LocaleProvider";
import type { OrderOption } from "@/lib/data";
import type { TransactionType } from "@prisma/client";

// Category *keys* are UI-only and never persisted. The *values* stored on the transaction
// (and shown/typed via the datalist) are the original Arabic strings — unchanged, so existing
// transaction data isn't affected by translating the displayed label.
const EXPENSE_CATEGORY_KEYS = ["production", "shipping", "marketing", "packaging", "other"] as const;
const REVENUE_CATEGORY_KEYS = ["sales", "other"] as const;
const CATEGORY_STORED_VALUES: Record<string, string> = {
  production: "إنتاج",
  shipping: "شحن وتوصيل",
  marketing: "تسويق",
  packaging: "مواد تعبئة",
  other: "أخرى",
  sales: "مبيعات",
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  orders,
  currency,
  locale,
}: {
  orders: OrderOption[];
  currency: string;
  locale: string;
}) {
  const [type, setType] = useState<TransactionType>("REVENUE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountMinor = inputToMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      setError(t("admin.finance.form.invalidAmount"));
      return;
    }
    setSaving(true);
    await createTransaction({
      type,
      amountMinor,
      category: category || undefined,
      description: description || undefined,
      orderId: orderId || undefined,
      date: new Date(date),
    });
    setSaving(false);
    setAmount("");
    setCategory("");
    setDescription("");
    setOrderId("");
    setDate(todayInputValue());
  }

  const categoryKeys = type === "REVENUE" ? REVENUE_CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-extrabold">{t("admin.finance.form.heading")}</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("REVENUE")}
          className={cn(
            "flex-1 rounded-xl border py-2 text-sm font-bold",
            type === "REVENUE" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
          )}
        >
          {t("admin.finance.types.REVENUE")}
        </button>
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={cn(
            "flex-1 rounded-xl border py-2 text-sm font-bold",
            type === "EXPENSE" ? "border-red-300 bg-red-50 text-red-600" : "border-border text-muted"
          )}
        >
          {t("admin.finance.types.EXPENSE")}
        </button>
      </div>

      <Input
        id="amount"
        label={t("admin.finance.form.amountLabel", { currency })}
        type="number"
        min={0}
        step="0.01"
        dir="ltr"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-bold text-ink">
          {t("admin.finance.form.categoryLabel")}
        </label>
        <input
          id="category"
          list="category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <datalist id="category-options">
          {categoryKeys.map((key) => (
            <option key={key} value={CATEGORY_STORED_VALUES[key]}>
              {t(`admin.finance.categories.${key}`)}
            </option>
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="orderId" className="text-sm font-bold text-ink">
          {t("admin.finance.form.orderLabel")}
        </label>
        <select
          id="orderId"
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            const order = orders.find((o) => o.id === e.target.value);
            if (order && type === "REVENUE" && !amount) {
              setAmount(minorToInput(order.totalMinor));
            }
          }}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">{t("admin.finance.form.noLink")}</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.customerName} — {formatMoney(o.totalMinor, currency, locale)} —{" "}
              {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(o.createdAt)}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="date"
        label={t("admin.finance.form.dateLabel")}
        type="date"
        dir="ltr"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Textarea
        id="description"
        label={t("admin.finance.form.notesLabel")}
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? t("common.saving") : t("common.add")}
      </Button>
    </form>
  );
}
