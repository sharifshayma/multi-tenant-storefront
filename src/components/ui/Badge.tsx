import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import type { OrderStatus } from "@prisma/client";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold",
        ORDER_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
