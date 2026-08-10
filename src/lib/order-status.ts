import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "IN_PROGRESS",
  "SHIPPED",
  "DELIVERED",
];

// Labels used to live here as a hardcoded Arabic map (ORDER_STATUS_LABELS).
// They're now dictionary-driven under `admin.orders.status.*` (same key set
// as this type) — translate at each locale-aware call site with
// `t(d, \`admin.orders.status.${status}\`)` and pass the result into
// <StatusBadge label=... /> (see src/components/ui/Badge.tsx).
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  NEW: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
};
