"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/actions/finance";
import { cn } from "@/lib/utils";

export function DeleteTransactionButton({ id }: { id: string }) {
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
          deleteTransaction(id);
        });
      }}
      onBlur={() => setConfirming(false)}
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50",
        confirming ? "bg-red-600 text-white" : "border border-red-200 text-red-600 hover:bg-red-50"
      )}
    >
      {pending ? "..." : confirming ? "تأكيد الحذف؟" : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
