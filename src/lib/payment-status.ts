export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID" | "GIFT";

/**
 * What the customer actually owes: the order total minus any discount given,
 * never below zero. Payment status, remaining balance and forecasted revenue
 * are all measured against this, not the gross total.
 */
export function getAmountPayable(totalNis: number, discountNis: number): number {
  return Math.max(0, totalNis - discountNis);
}

/**
 * Payment status derived from what's been paid vs. what's owed after discount.
 * When a discount covers the whole order (nothing left to pay and nothing
 * paid), it's a gift rather than "unpaid".
 */
export function getPaymentStatus(
  paidNis: number,
  totalNis: number,
  discountNis: number
): PaymentStatus {
  const payable = getAmountPayable(totalNis, discountNis);
  if (payable <= 0) {
    if (paidNis > 0) return "OVERPAID";
    // Fully covered by a discount => a gift; otherwise a zero-value order.
    return discountNis > 0 ? "GIFT" : "PAID";
  }
  if (paidNis <= 0) return "UNPAID";
  if (paidNis > payable) return "OVERPAID";
  if (paidNis >= payable) return "PAID";
  return "PARTIAL";
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "لم يُدفع",
  PARTIAL: "دفع جزئي",
  PAID: "مدفوع بالكامل",
  OVERPAID: "دُفع أكثر من اللازم",
  GIFT: "هدية",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-50 text-red-600",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-accent/10 text-accent",
  OVERPAID: "bg-amber-100 text-amber-800",
  GIFT: "bg-purple-100 text-purple-800",
};
