"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/orders";
import type { OrderStatus } from "@prisma/client";

const options: { value: OrderStatus; label: string }[] = [
  { value: "NEW", label: "جديد" },
  { value: "CONTACTED", label: "تم التواصل" },
  { value: "FULFILLED", label: "تم التسليم" },
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        setValue(next);
        startTransition(() => {
          updateOrderStatus(orderId, next);
        });
      }}
      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
