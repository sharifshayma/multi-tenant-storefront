import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const tabs: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "الكل" },
  ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] })),
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter =
    status && ORDER_STATUSES.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : undefined;

  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true, collectionItems: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">الطلبات</h1>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "ALL" ? "/admin/orders" : `/admin/orders?status=${tab.value}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold",
              (tab.value === "ALL" && !filter) || tab.value === filter
                ? "bg-brand text-white"
                : "bg-white text-muted hover:text-ink border border-border"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-muted">لا توجد طلبات.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-bold text-brand hover:underline"
                  >
                    {order.customerName}
                  </Link>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted">
                  <span dir="ltr">{order.phone}</span>
                  <span>{order.city}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {order._count.items + order._count.collectionItems} كتب ·{" "}
                    {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(order.createdAt)}
                  </span>
                  <Price nis={order.totalNis} className="font-extrabold text-brand" />
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
                  <th className="p-3">الكتب</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
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
                      <Price nis={order.totalNis} />
                    </td>
                    <td className="p-3 text-muted">
                      {new Intl.DateTimeFormat("ar", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(order.createdAt)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
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
