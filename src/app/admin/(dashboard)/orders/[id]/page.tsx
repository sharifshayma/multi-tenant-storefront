import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Price } from "@/components/ui/Price";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { book: true } } },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/orders"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الطلبات
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">
          طلب #{order.id.slice(0, 8)}
        </h1>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-3 font-extrabold">بيانات العميل</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">الاسم</dt>
              <dd className="font-bold">{order.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">الهاتف</dt>
              <dd dir="ltr" className="font-bold">
                {order.phone}
              </dd>
            </div>
            {order.email && (
              <div className="flex justify-between">
                <dt className="text-muted">البريد الإلكتروني</dt>
                <dd dir="ltr" className="font-bold">
                  {order.email}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">المدينة</dt>
              <dd className="font-bold">{order.city}</dd>
            </div>
            {order.notes && (
              <div className="flex flex-col gap-1">
                <dt className="text-muted">ملاحظات</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">تاريخ الطلب</dt>
              <dd>
                {new Intl.DateTimeFormat("ar", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(order.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-3 font-extrabold">الكتب المطلوبة</h2>
          <div className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-sm">
                <span>
                  {item.book.title} × {item.quantity}
                </span>
                <Price nis={item.unitPriceNis * item.quantity} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-extrabold">
            <span>الإجمالي</span>
            <Price nis={order.totalNis} className="text-brand" />
          </div>
        </div>
      </div>
    </div>
  );
}
