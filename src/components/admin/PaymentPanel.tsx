"use client";

import { useState } from "react";
import { recordPayment } from "@/actions/finance";
import { setOrderDiscount } from "@/actions/orders";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DeleteTransactionButton } from "@/components/admin/DeleteTransactionButton";
import { cn } from "@/lib/utils";
import { minorToInput, inputToMinor } from "@/lib/money-input";
import {
  getAmountPayable,
  getPaymentStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from "@/lib/payment-status";
import { useT } from "@/i18n/LocaleProvider";

type Payment = { id: string; amountMinor: number; date: Date };

export function PaymentPanel({
  orderId,
  totalMinor,
  discountMinor,
  discountReason,
  payments,
  currency,
  locale,
}: {
  orderId: string;
  totalMinor: number;
  discountMinor: number;
  discountReason: string | null;
  payments: Payment[];
  currency: string;
  locale: string;
}) {
  const { t } = useT();
  const payable = getAmountPayable(totalMinor, discountMinor);
  const paid = payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const remaining = Math.max(0, payable - paid);
  const overpaidBy = Math.max(0, paid - payable);
  const status = getPaymentStatus(paid, totalMinor, discountMinor);

  const [amount, setAmount] = useState(remaining > 0 ? minorToInput(remaining) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discount sub-form state
  const [discountAmount, setDiscountAmount] = useState(discountMinor > 0 ? minorToInput(discountMinor) : "");
  const [reason, setReason] = useState(discountReason ?? "");
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountSaved, setDiscountSaved] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const previewDiscount = inputToMinor(discountAmount);
  const previewPayable = getAmountPayable(totalMinor, previewDiscount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const val = inputToMinor(amount);
    if (!val || val <= 0) {
      setError(t("admin.orders.payment.invalidAmount"));
      return;
    }
    setSaving(true);
    await recordPayment({ orderId, amountMinor: val });
    // No need to reset local state here: the parent page re-renders with a new
    // `payments` array after revalidation, and the `key` it passes to this
    // component forces a clean remount that re-derives inputs from fresh props.
    setSaving(false);
  }

  async function handleDiscountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDiscountError(null);
    const val = discountAmount.trim() === "" ? 0 : inputToMinor(discountAmount);
    if (!Number.isFinite(val) || val < 0) {
      setDiscountError(t("admin.orders.payment.invalidDiscount"));
      return;
    }
    setDiscountSaving(true);
    const res = await setOrderDiscount({ orderId, discountMinor: val, discountReason: reason });
    setDiscountSaving(false);
    if (!res.ok) {
      setDiscountError(res.error);
      return;
    }
    setDiscountSaved(true);
    setTimeout(() => setDiscountSaved(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-extrabold">{t("admin.orders.table.payment")}</h2>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", PAYMENT_STATUS_STYLES[status])}>
          {PAYMENT_STATUS_LABELS[status]}
        </span>
      </div>

      {discountMinor > 0 && (
        <div className="mb-3 flex flex-col gap-1 rounded-xl bg-paper px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("admin.orders.payment.orderTotal")}</span>
            <Price minor={totalMinor} currency={currency} locale={locale} className="text-muted" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("admin.orders.amounts.discount")}</span>
            <Price minor={-discountMinor} currency={currency} locale={locale} className="font-bold text-accent" />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1">
            <span className="font-bold">{t("admin.orders.amounts.payable")}</span>
            <Price minor={payable} currency={currency} locale={locale} className="font-extrabold text-brand" />
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-muted">
          {discountMinor > 0
            ? t("admin.orders.payment.paidOfPayable")
            : t("admin.orders.payment.paidOfTotal")}
        </span>
        <span className="flex items-center gap-1">
          <Price minor={paid} currency={currency} locale={locale} className="font-extrabold text-brand" />
          <span className="text-muted">/</span>
          <Price minor={payable} currency={currency} locale={locale} className="text-muted" />
        </span>
      </div>

      {overpaidBy > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
          {t("admin.orders.payment.overpaidPrefix")}{" "}
          <Price minor={overpaidBy} currency={currency} locale={locale} className="inline" />{" "}
          {t("admin.orders.payment.overpaidSuffix")}
        </p>
      )}

      {remaining > 0 && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] flex-1">
            <Input
              id="paymentAmount"
              label={t("admin.orders.payment.recordPaymentLabel", { currency })}
              type="number"
              min={0}
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("admin.orders.payment.record")}
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
                <Price minor={p.amountMinor} currency={currency} locale={locale} className="font-bold text-accent" />
                <DeleteTransactionButton id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discount editor — lives in the same box as payment, entered the same way. */}
      <form onSubmit={handleDiscountSubmit} className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] flex-1">
            <Input
              id="discountAmount"
              label={t("admin.orders.payment.discountLabel", { currency })}
              type="number"
              min={0}
              max={minorToInput(totalMinor)}
              step="0.01"
              dir="ltr"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>
          <Button type="submit" variant="ghost" disabled={discountSaving}>
            {discountSaving
              ? t("common.saving")
              : discountSaved
                ? t("admin.orders.payment.discountSaved")
                : t("admin.orders.payment.saveDiscount")}
          </Button>
        </div>
        <Input
          id="discountReason"
          label={t("admin.orders.payment.discountReasonLabel")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {previewDiscount > 0 && previewDiscount !== discountMinor && (
          <p className="text-xs text-muted">
            {t("admin.orders.payment.payableAfterDiscount")}{" "}
            <Price minor={previewPayable} currency={currency} locale={locale} className="inline font-bold text-brand" />
          </p>
        )}
        {discountError && <p className="text-sm text-red-600">{discountError}</p>}
      </form>
    </div>
  );
}
