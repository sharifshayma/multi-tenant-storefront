"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@prisma/client";

// Colored dropdown for editing an order's status directly from the orders
// table. Looks like the status badge (colored by current status) but is a
// native <select>; changing it saves via updateOrderStatus, which
// revalidates /admin/orders so the list re-renders (and re-filters).
export function InlineOrderStatusSelect({
  orderId,
  status: initial,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initial);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      aria-label="حالة الطلب"
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        setStatus(next);
        startTransition(() => {
          updateOrderStatus(orderId, next);
        });
      }}
      className={cn(
        "cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60",
        ORDER_STATUS_STYLES[status]
      )}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white font-bold text-ink">
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
