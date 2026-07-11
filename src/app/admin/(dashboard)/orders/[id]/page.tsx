import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Price } from "@/components/ui/Price";
import { OrderStatusManager } from "@/components/admin/OrderStatusManager";
import { PaymentPanel } from "@/components/admin/PaymentPanel";
import { CustomerInfoEditForm } from "@/components/admin/CustomerInfoEditForm";
import { OrderItemsEditor } from "@/components/admin/OrderItemsEditor";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, allBooks] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { book: true } },
        collectionItems: {
          include: { collection: true, selectedBooks: { include: { book: true } } },
        },
        transactions: {
          where: { type: "REVENUE" },
          orderBy: { date: "desc" },
          select: { id: true, amountNis: true, date: true },
        },
      },
    }),
    prisma.book.findMany({
      where: { isArchived: false },
      orderBy: { position: "asc" },
      select: { id: true, title: true, priceNis: true, coverImage: true },
    }),
  ]);
  if (!order) notFound();

  const canEditItems = order.status === "NEW" || order.status === "CONFIRMED";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/orders"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الطلبات
      </Link>

      <h1 className="text-2xl font-extrabold">طلب #{order.id.slice(0, 8)}</h1>

      <OrderStatusManager
        order={{
          id: order.id,
          status: order.status,
          customerName: order.customerName,
          totalNis: order.totalNis,
          items: order.items.map((i) => ({ title: i.book.title, quantity: i.quantity })),
          collectionItems: order.collectionItems.map((i) => ({
            title: i.collection.title,
            quantity: i.quantity,
          })),
        }}
        phone={order.phone}
        email={order.email}
      />

      <PaymentPanel
        key={`${order.transactions.length}-${order.totalNis}`}
        orderId={order.id}
        totalNis={order.totalNis}
        payments={order.transactions}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CustomerInfoEditForm
          orderId={order.id}
          customerName={order.customerName}
          phone={order.phone}
          email={order.email}
          city={order.city}
          notes={order.notes}
          createdAt={order.createdAt}
        />

        {canEditItems ? (
          <OrderItemsEditor
            orderId={order.id}
            initialItems={order.items.map((i) => ({
              bookId: i.bookId,
              title: i.book.title,
              coverImage: i.book.coverImage,
              priceNis: i.unitPriceNis,
              quantity: i.quantity,
            }))}
            initialCollectionItems={order.collectionItems.map((i) => ({
              id: i.id,
              title: i.collection.title,
              unitPriceNis: i.unitPriceNis,
              quantity: i.quantity,
              bookTitles: i.selectedBooks.map((sb) => sb.book.title),
            }))}
            allBooks={allBooks}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 font-extrabold">الكتب والمجموعات المطلوبة</h2>
            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.book.title} × {item.quantity}
                  </span>
                  <Price nis={item.unitPriceNis * item.quantity} />
                </div>
              ))}
              {order.collectionItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold">
                      {item.collection.title} (مجموعة) × {item.quantity}
                    </span>
                    <Price nis={item.unitPriceNis * item.quantity} />
                  </div>
                  <span className="text-xs text-muted">
                    {item.selectedBooks.map((sb) => sb.book.title).join("، ")}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-extrabold">
              <span>الإجمالي</span>
              <Price nis={order.totalNis} className="text-brand" />
            </div>
            <p className="mt-3 text-xs text-muted">
              لا يمكن تعديل محتويات الطلب بعد بدء التجهيز أو الشحن.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
