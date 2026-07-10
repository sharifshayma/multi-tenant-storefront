"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RotateCcw, Trash2 } from "lucide-react";
import { updateOrderStatus, deleteOrder } from "@/actions/orders";
import { getStatusMessage, getWhatsAppLink, getEmailLink, type MessageOrder } from "@/lib/messages";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusManager({
  order,
  phone,
  email,
}: {
  order: MessageOrder & { status: OrderStatus };
  phone: string;
  email?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [message, setMessage] = useState(() => getStatusMessage(order.status, order));
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, startTransition] = useTransition();

  const whatsappLink = useMemo(() => getWhatsAppLink(phone, message), [phone, message]);
  const emailLink = useMemo(
    () => (email ? getEmailLink(email, `تحديث بخصوص طلبك من جذور عربية، أجنحة عالمية`, message) : null),
    [email, message]
  );

  function handleStatusChange(next: OrderStatus) {
    setStatus(next);
    setMessage(getStatusMessage(next, order));
    startTransition(() => {
      updateOrderStatus(order.id, next);
    });
  }

  function handleDelete() {
    if (!deleting) {
      setDeleting(true);
      return;
    }
    startTransition(async () => {
      await deleteOrder(order.id);
      router.push("/admin/orders");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          disabled={pending}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-50"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleDelete}
          onBlur={() => setDeleting(false)}
          className={
            deleting
              ? "rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white"
              : "flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "اضغط للتأكيد" : "حذف الطلب"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">رسالة للعميل</h2>
          <button
            type="button"
            onClick={() => setMessage(getStatusMessage(status, order))}
            className="flex items-center gap-1 text-xs font-bold text-muted hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة إنشاء
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          dir="rtl"
          className="w-full rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(message);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "تم النسخ" : "نسخ الرسالة"}
          </Button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" size="sm">
              إرسال عبر واتساب
            </Button>
          </a>
          {emailLink && (
            <a href={emailLink}>
              <Button type="button" variant="ghost" size="sm">
                إرسال عبر البريد
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
