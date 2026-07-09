import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const tabs: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "الكل" },
  { value: "NEW", label: "جديد" },
  { value: "CONTACTED", label: "تم التواصل" },
  { value: "FULFILLED", label: "تم التسليم" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter =
    status && ["NEW", "CONTACTED", "FULFILLED"].includes(status)
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

      <div className="flex gap-2 border-b border-border pb-2">
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
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
