"use client";

import { useState } from "react";
import { createTransaction } from "@/actions/finance";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { OrderOption } from "@/lib/data";
import type { TransactionType } from "@prisma/client";

const EXPENSE_CATEGORIES = ["طباعة", "شحن وتوصيل", "تسويق", "مواد تعبئة", "أخرى"];
const REVENUE_CATEGORIES = ["مبيعات", "أخرى"];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ orders }: { orders: OrderOption[] }) {
  const [type, setType] = useState<TransactionType>("REVENUE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNis = Number(amount);
    if (!amountNis || amountNis <= 0) {
      setError("الرجاء إدخال مبلغ صحيح");
      return;
    }
    setSaving(true);
    await createTransaction({
      type,
      amountNis,
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

  const categories = type === "REVENUE" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-extrabold">تسجيل حركة مالية</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("REVENUE")}
          className={cn(
            "flex-1 rounded-xl border py-2 text-sm font-bold",
            type === "REVENUE" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
          )}
        >
          إيراد
        </button>
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={cn(
            "flex-1 rounded-xl border py-2 text-sm font-bold",
            type === "EXPENSE" ? "border-red-300 bg-red-50 text-red-600" : "border-border text-muted"
          )}
        >
          مصروف
        </button>
      </div>

      <Input
        id="amount"
        label="المبلغ (شيكل)"
        type="number"
        min={0}
        dir="ltr"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-bold text-ink">
          الفئة (اختياري)
        </label>
        <input
          id="category"
          list="category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="orderId" className="text-sm font-bold text-ink">
          ربط بطلب (اختياري)
        </label>
        <select
          id="orderId"
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            const order = orders.find((o) => o.id === e.target.value);
            if (order && type === "REVENUE" && !amount) {
              setAmount(String(order.totalNis));
            }
          }}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">بدون ربط</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.customerName} — {o.totalNis} ₪ — {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(o.createdAt)}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="date"
        label="التاريخ"
        type="date"
        dir="ltr"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Textarea
        id="description"
        label="ملاحظات (اختياري)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "جارِ الحفظ..." : "إضافة"}
      </Button>
    </form>
  );
}
