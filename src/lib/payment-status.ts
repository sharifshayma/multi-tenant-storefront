export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";

export function getPaymentStatus(paidNis: number, totalNis: number): PaymentStatus {
  if (paidNis <= 0) return "UNPAID";
  if (paidNis > totalNis) return "OVERPAID";
  if (paidNis >= totalNis) return "PAID";
  return "PARTIAL";
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "لم يُدفع",
  PARTIAL: "دفع جزئي",
  PAID: "مدفوع بالكامل",
  OVERPAID: "دُفع أكثر من اللازم",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-50 text-red-600",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-accent/10 text-accent",
  OVERPAID: "bg-amber-100 text-amber-800",
};
