"use client";

import { useState } from "react";
import { createStockMovement } from "@/actions/stock";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/LocaleProvider";
import type { OrderOption, StockLevel } from "@/lib/data";
import type { StockMovementType } from "@prisma/client";

// `key`/`type`/`sign` are never persisted as-is (only `type` and the computed signed
// `quantity` are saved), so the dictionary key used for the label can freely differ from the
// original UI keys without affecting stored data.
const MOVEMENT_OPTIONS: {
  key: string;
  labelKey: string;
  type: StockMovementType;
  sign: 1 | -1;
}[] = [
  { key: "printed", labelKey: "printed", type: "PRINTED", sign: 1 },
  { key: "adjust_up", labelKey: "adjustUp", type: "ADJUSTMENT", sign: 1 },
  { key: "adjust_down", labelKey: "adjustDown", type: "ADJUSTMENT", sign: -1 },
  { key: "damaged", labelKey: "damaged", type: "DAMAGED", sign: -1 },
  { key: "manual_sale", labelKey: "manualSale", type: "SHIPPED", sign: -1 },
];

export function StockMovementForm({
  books,
  orders,
  itemNounSingular,
}: {
  books: StockLevel[];
  orders: OrderOption[];
  itemNounSingular: string;
}) {
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [optionKey, setOptionKey] = useState("printed");
  const [quantity, setQuantity] = useState("");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError(t("admin.stock.form.invalidQuantity"));
      return;
    }
    const option = MOVEMENT_OPTIONS.find((o) => o.key === optionKey)!;
    setSaving(true);
    await createStockMovement({
      bookId,
      type: option.type,
      quantity: qty * option.sign,
      orderId: orderId || undefined,
      note: note || undefined,
    });
    setSaving(false);
    setQuantity("");
    setOrderId("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-extrabold">{t("admin.stock.form.heading")}</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bookId" className="text-sm font-bold text-ink">
          {t("admin.stock.form.itemLabel", { singular: itemNounSingular })}
        </label>
        <select
          id="bookId"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} — {t("admin.stock.form.currentStockSuffix", { n: b.currentStock })}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="movementType" className="text-sm font-bold text-ink">
          {t("admin.stock.form.movementTypeLabel")}
        </label>
        <select
          id="movementType"
          value={optionKey}
          onChange={(e) => setOptionKey(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {MOVEMENT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {t(`admin.stock.movementOptions.${o.labelKey}`)}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="quantity"
        label={t("admin.stock.form.quantityLabel")}
        type="number"
        min={1}
        dir="ltr"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="stockOrderId" className="text-sm font-bold text-ink">
          {t("admin.stock.form.orderLabel")}
        </label>
        <select
          id="stockOrderId"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">{t("admin.stock.form.noLink")}</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.customerName} — {new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(o.createdAt)}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        id="note"
        label={t("admin.stock.form.notesLabel")}
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? t("common.saving") : t("common.add")}
      </Button>
    </form>
  );
}
