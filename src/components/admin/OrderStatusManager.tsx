"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RotateCcw, Trash2 } from "lucide-react";
import { updateOrderStatus, deleteOrder } from "@/actions/orders";
import { getStatusMessage, getWhatsAppLink, getEmailLink, type MessageOrder } from "@/lib/messages";
import { ORDER_STATUSES } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/LocaleProvider";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusManager({
  order,
  phone,
  email,
  storeName,
}: {
  order: MessageOrder & { status: OrderStatus };
  phone: string;
  email?: string | null;
  storeName: string;
}) {
  const { t, dir, locale } = useT();
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [message, setMessage] = useState(() =>
    getStatusMessage(order.status, order, storeName, locale)
  );
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, startTransition] = useTransition();

  const whatsappLink = useMemo(() => getWhatsAppLink(phone, message), [phone, message]);
  const emailLink = useMemo(
    () => (email ? getEmailLink(email, t("admin.orders.emailSubject", { storeName }), message) : null),
    [email, message, t, storeName]
  );

  function handleStatusChange(next: OrderStatus) {
    setStatus(next);
    setMessage(getStatusMessage(next, order, storeName, locale));
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
          data-umami-event="order-status-change"
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-50"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`admin.orders.status.${s}`)}
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
          {deleting ? t("admin.orders.confirmDelete") : t("admin.orders.deleteOrder")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">{t("admin.orders.messageForCustomer")}</h2>
          <button
            type="button"
            onClick={() => setMessage(getStatusMessage(status, order, storeName, locale))}
            className="flex items-center gap-1 text-xs font-bold text-muted hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("admin.orders.regenerate")}
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          dir={dir}
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
            {copied ? t("admin.orders.copied") : t("admin.orders.copyMessage")}
          </Button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" size="sm">
              {t("admin.orders.sendViaWhatsapp")}
            </Button>
          </a>
          {emailLink && (
            <a href={emailLink}>
              <Button type="button" variant="ghost" size="sm">
                {t("admin.orders.sendViaEmail")}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
