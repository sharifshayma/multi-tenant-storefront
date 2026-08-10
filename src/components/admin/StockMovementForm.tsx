"use client";

import { useState } from "react";
import { createStockMovement } from "@/actions/stock";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { OrderOption, StockLevel } from "@/lib/data";
import type { StockMovementType } from "@prisma/client";

const MOVEMENT_OPTIONS: {
  key: string;
  label: string;
  type: StockMovementType;
  sign: 1 | -1;
}[] = [
  { key: "printed", label: "إنتاج (إضافة مخزون)", type: "PRINTED", sign: 1 },
  { key: "adjust_up", label: "تصحيح — زيادة", type: "ADJUSTMENT", sign: 1 },
  { key: "adjust_down", label: "تصحيح — نقصان", type: "ADJUSTMENT", sign: -1 },
  { key: "damaged", label: "تالف / فاقد", type: "DAMAGED", sign: -1 },
  { key: "manual_sale", label: "بيع يدوي (خارج الموقع)", type: "SHIPPED", sign: -1 },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("الرجاء إدخال كمية صحيحة");
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
      <h2 className="font-extrabold">تسجيل حركة مخزون</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bookId" className="text-sm font-bold text-ink">
          ال{itemNounSingular}
        </label>
        <select
          id="bookId"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} — المخزون الحالي: {b.currentStock}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="movementType" className="text-sm font-bold text-ink">
          نوع الحركة
        </label>
        <select
          id="movementType"
          value={optionKey}
          onChange={(e) => setOptionKey(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {MOVEMENT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="quantity"
        label="الكمية"
        type="number"
        min={1}
        dir="ltr"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="stockOrderId" className="text-sm font-bold text-ink">
          ربط بطلب (اختياري)
        </label>
        <select
          id="stockOrderId"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">بدون ربط</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.customerName} — {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(o.createdAt)}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        id="note"
        label="ملاحظات (اختياري)"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "جارِ الحفظ..." : "إضافة"}
      </Button>
    </form>
  );
}
