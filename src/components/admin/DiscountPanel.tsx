"use client";

import { useState } from "react";
import { setOrderDiscount } from "@/actions/orders";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { getAmountPayable } from "@/lib/payment-status";

export function DiscountPanel({
  orderId,
  totalNis,
  discountNis,
  discountReason,
}: {
  orderId: string;
  totalNis: number;
  discountNis: number;
  discountReason: string | null;
}) {
  const [amount, setAmount] = useState(discountNis > 0 ? String(discountNis) : "");
  const [reason, setReason] = useState(discountReason ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = Number(amount) || 0;
  const previewPayable = getAmountPayable(totalNis, parsed);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const val = Number(amount);
    if (amount.trim() !== "" && (!Number.isFinite(val) || val < 0)) {
      setError("الرجاء إدخال قيمة خصم صحيحة");
      return;
    }
    setSaving(true);
    const res = await setOrderDiscount({
      orderId,
      discountNis: amount.trim() === "" ? 0 : val,
      discountReason: reason,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-extrabold">الخصم</h2>
      <Input
        id="orderDiscountAmount"
        label="قيمة الخصم (شيكل)"
        type="number"
        min={0}
        max={totalNis}
        dir="ltr"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Textarea
        id="orderDiscountReason"
        label="سبب الخصم (اختياري)"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex items-center justify-between rounded-xl bg-paper px-4 py-2 text-sm">
        <span className="font-bold">المبلغ المستحق بعد الخصم</span>
        <Price nis={previewPayable} className="font-extrabold text-brand" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} size="sm" className="self-start">
        {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ الخصم"}
      </Button>
    </form>
  );
}
