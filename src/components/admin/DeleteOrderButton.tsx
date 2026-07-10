"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteOrder } from "@/actions/orders";
import { cn } from "@/lib/utils";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirming) {
          setConfirming(true);
          return;
        }
        startTransition(() => {
          deleteOrder(orderId);
        });
      }}
      onBlur={() => setConfirming(false)}
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50",
        confirming
          ? "bg-red-600 text-white"
          : "text-red-600 hover:bg-red-50 border border-red-200"
      )}
    >
      {pending ? "..." : confirming ? "تأكيد الحذف؟" : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
