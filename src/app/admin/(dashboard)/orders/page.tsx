import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { Price } from "@/components/ui/Price";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { InlineOrderStatusSelect } from "@/components/admin/InlineOrderStatusSelect";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { getPrintList, getOrderPaymentTotals } from "@/lib/data";
import {
  getPaymentStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  type PaymentStatus,
} from "@/lib/payment-status";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const statusTabs: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "الكل" },
  ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] })),
];

// Payment is a derived status (paid-vs-payable), so these filters are applied
// in-memory after computing each order's payment status. "مدفوع" includes
// overpaid orders (money fully collected); gifts show only under "الكل".
const paymentFilters: { value: string; label: string; match: PaymentStatus[] }[] = [
  { value: "PAID", label: "مدفوع", match: ["PAID", "OVERPAID"] },
  { value: "PARTIAL", label: "دفع جزئي", match: ["PARTIAL"] },
  { value: "UNPAID", label: "لم يُدفع", match: ["UNPAID"] },
];

function ordersHref(status?: string, payment?: string): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (payment) params.set("payment", payment);
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

const chipClass = (active: boolean) =>
  cn(
    "rounded-full px-4 py-1.5 text-sm font-bold",
    active ? "bg-brand text-white" : "border border-border bg-white text-muted hover:text-ink"
  );

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string }>;
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const { singular, plural } = storeNoun(store);

  const { status, payment } = await searchParams;
  const filter =
    status && ORDER_STATUSES.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : undefined;
  const paymentFilter = paymentFilters.find((p) => p.value === payment);

  const [orders, printList, paymentTotals] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id, ...(filter ? { status: filter } : {}) },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true, collectionItems: true } } },
    }),
    getPrintList(store.id, "CONFIRMED"),
    getOrderPaymentTotals(store.id),
  ]);
  const totalCopies = printList.reduce((sum, b) => sum + b.quantity, 0);

  const enriched = orders.map((order) => ({
    order,
    paymentStatus: getPaymentStatus(
      paymentTotals.get(order.id) ?? 0,
      order.totalMinor,
      order.discountMinor
    ),
  }));
  const visible = paymentFilter
    ? enriched.filter((e) => paymentFilter.match.includes(e.paymentStatus))
    : enriched;

  // Carry the active filters into each order link so "back" returns to the
  // same filtered view (the detail page's back-link mirrors this).
  const listQuery = ordersHref(filter, paymentFilter?.value).replace("/admin/orders", "");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">الطلبات</h1>

      {printList.length > 0 && (
        <div className="rounded-2xl border-2 border-gold/40 bg-gold/10 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold">قائمة الإنتاج</h2>
              <p className="text-sm text-muted">
                عدد النسخ المطلوبة لكل {singular} في الطلبات المؤكدة (مؤكد)
              </p>
            </div>
            <span className="rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white">
              {totalCopies} نسخة إجمالاً
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {printList.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-white p-2"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                  />
                </span>
                <span className="line-clamp-2 min-w-0 flex-1 text-xs font-bold">{book.title}</span>
                <span className="shrink-0 text-lg font-extrabold text-brand">{book.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters — status and payment combine (e.g. قيد التجهيز + لم يُدفع) */}
      <div className="flex flex-col gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 shrink-0 text-sm font-bold text-muted">الحالة</span>
          {statusTabs.map((tab) => (
            <Link
              key={tab.value}
              href={ordersHref(tab.value === "ALL" ? undefined : tab.value, paymentFilter?.value)}
              className={chipClass((tab.value === "ALL" && !filter) || tab.value === filter)}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 shrink-0 text-sm font-bold text-muted">الدفع</span>
          <Link href={ordersHref(filter, undefined)} className={chipClass(!paymentFilter)}>
            الكل
          </Link>
          {paymentFilters.map((pf) => (
            <Link
              key={pf.value}
              href={ordersHref(filter, pf.value)}
              className={chipClass(paymentFilter?.value === pf.value)}
            >
              {pf.label}
            </Link>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted">لا توجد طلبات.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {visible.map(({ order, paymentStatus }) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/orders/${order.id}${listQuery}`}
                    className="font-bold text-brand hover:underline"
                  >
                    {order.customerName}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold",
                        PAYMENT_STATUS_STYLES[paymentStatus]
                      )}
                    >
                      {PAYMENT_STATUS_LABELS[paymentStatus]}
                    </span>
                    <InlineOrderStatusSelect orderId={order.id} status={order.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted">
                  <span dir="ltr">{order.phone}</span>
                  <span>{order.city}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {order._count.items + order._count.collectionItems} {plural} ·{" "}
                    {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(order.createdAt)}
                  </span>
                  <Price
                    minor={order.totalMinor}
                    currency={store.currency}
                    locale={store.defaultLocale}
                    className="font-extrabold text-brand"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <DeleteOrderButton orderId={order.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-muted">
                  <th className="p-3">الاسم</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">المدينة</th>
                  <th className="p-3">ال{plural}</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الدفع</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ order, paymentStatus }) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${order.id}${listQuery}`}
                        className="font-bold text-brand hover:underline"
                      >
                        {order.customerName}
                      </Link>
                    </td>
                    <td className="p-3" dir="ltr">
                      {order.phone}
                    </td>
                    <td className="p-3">{order.city}</td>
                    <td className="p-3">{order._count.items + order._count.collectionItems}</td>
                    <td className="p-3">
                      <Price
                        minor={order.totalMinor}
                        currency={store.currency}
                        locale={store.defaultLocale}
                      />
                    </td>
                    <td className="p-3 text-muted">
                      {new Intl.DateTimeFormat("ar", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(order.createdAt)}
                    </td>
                    <td className="p-3">
                      <InlineOrderStatusSelect orderId={order.id} status={order.status} />
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold",
                          PAYMENT_STATUS_STYLES[paymentStatus]
                        )}
                      >
                        {PAYMENT_STATUS_LABELS[paymentStatus]}
                      </span>
                    </td>
                    <td className="p-3">
                      <DeleteOrderButton orderId={order.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
