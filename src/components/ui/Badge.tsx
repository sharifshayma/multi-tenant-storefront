import { cn } from "@/lib/utils";
import { ORDER_STATUS_STYLES } from "@/lib/order-status";
import type { OrderStatus } from "@prisma/client";

// StatusBadge is rendered from both server and client components (see
// order-status.ts), so it takes the already-translated `label` as a prop
// instead of looking it up itself — each caller resolves
// `admin.orders.status.${status}` from its own locale-aware dictionary/`t()`
// and passes the result in.
export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold",
        ORDER_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {label}
    </span>
  );
}
