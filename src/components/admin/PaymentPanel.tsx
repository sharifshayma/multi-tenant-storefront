"use client";

import { useState } from "react";
import { recordPayment } from "@/actions/finance";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DeleteTransactionButton } from "@/components/admin/DeleteTransactionButton";
import { cn } from "@/lib/utils";
import { getPaymentStatus, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "@/lib/payment-status";

type Payment = { id: string; amountNis: number; date: Date };

export function PaymentPanel({
  orderId,
  totalNis,
  payments,
}: {
  orderId: string;
  totalNis: number;
  payments: Payment[];
}) {
  const paid = payments.reduce((sum, p) => sum + p.amountNis, 0);
  const remaining = Math.max(0, totalNis - paid);
  const status = getPaymentStatus(paid, totalNis);

  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const val = Number(amount);
    if (!val || val <= 0) {
      setError("الرجاء إدخال مبلغ صحيح");
      return;
    }
    setSaving(true);
    await recordPayment({ orderId, amountNis: val });
    // No need to reset local state here: the parent page re-renders with a
    // new `payments` array after revalidation, and the `key` it passes to
    // this component (keyed on payments.length) forces a clean remount that
    // re-derives `amount` from the new remaining balance.
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-extrabold">الدفع</h2>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", PAYMENT_STATUS_STYLES[status])}>
          {PAYMENT_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-muted">المدفوع من الإجمالي</span>
        <span className="flex items-center gap-1">
          <Price nis={paid} className="font-extrabold text-brand" />
          <span className="text-muted">/</span>
          <Price nis={totalNis} className="text-muted" />
        </span>
      </div>

      {remaining > 0 && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] flex-1">
            <Input
              id="paymentAmount"
              label="تسجيل دفعة (شيكل)"
              type="number"
              min={0}
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "جارِ الحفظ..." : "تسجيل"}
          </Button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {payments.length > 0 && (
        <div className="mt-4 flex flex-col divide-y divide-border border-t border-border">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted">
                {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(p.date)}
              </span>
              <div className="flex items-center gap-2">
                <Price nis={p.amountNis} className="font-bold text-accent" />
                <DeleteTransactionButton id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
