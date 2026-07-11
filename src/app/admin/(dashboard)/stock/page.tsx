import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getStockLevels, getOrdersForSelect } from "@/lib/data";
import { StockMovementForm } from "@/components/admin/StockMovementForm";
import { DeleteStockMovementButton } from "@/components/admin/DeleteStockMovementButton";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PRINTED: "طباعة",
  SHIPPED: "شحن",
  ADJUSTMENT: "تصحيح",
  DAMAGED: "تالف/فاقد",
};

export default async function AdminStockPage() {
  const [stockLevels, orders, movements] = await Promise.all([
    getStockLevels(),
    getOrdersForSelect(),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        book: { select: { title: true, coverImage: true } },
        order: { select: { id: true, customerName: true } },
      },
    }),
  ]);

  const totalUnits = stockLevels.reduce((sum, b) => sum + b.currentStock, 0);
  const totalValue = stockLevels.reduce((sum, b) => sum + b.currentStock * b.priceNis, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">المخزون</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">إجمالي عدد النسخ في المخزون</p>
          <p className="mt-2 text-2xl font-extrabold text-brand">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">القيمة التقديرية للمخزون</p>
          <Price nis={totalValue} className="mt-2 block text-2xl font-extrabold text-brand" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">المخزون الحالي لكل كتاب</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stockLevels.map((b) => (
            <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border bg-white p-2">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                <Image src={b.coverImage} alt={b.title} fill sizes="40px" className="object-contain p-0.5" />
              </span>
              <span className="line-clamp-2 min-w-0 flex-1 text-xs font-bold">{b.title}</span>
              <span
                className={cn(
                  "shrink-0 text-lg font-extrabold",
                  b.currentStock <= 0 ? "text-red-600" : "text-brand"
                )}
              >
                {b.currentStock}
              </span>
            </div>
          ))}
        </div>
      </div>

      <StockMovementForm books={stockLevels} orders={orders} />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">سجل حركات المخزون</h2>
        {movements.length === 0 ? (
          <p className="text-muted">لا توجد حركات مخزون بعد.</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {movements.map((m) => (
                <div key={m.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{m.book.title}</span>
                    <span className={cn("font-extrabold", m.quantity > 0 ? "text-accent" : "text-red-600")}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{MOVEMENT_TYPE_LABELS[m.type] ?? m.type}</span>
                    <span>{new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(m.createdAt)}</span>
                  </div>
                  {(m.order || m.note) && (
                    <div className="text-sm text-muted">
                      {m.order && (
                        <Link href={`/admin/orders/${m.order.id}`} className="text-brand hover:underline">
                          {m.order.customerName}
                        </Link>
                      )}
                      {m.order && m.note && " · "}
                      {m.note}
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    <DeleteStockMovementButton id={m.id} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-muted">
                    <th className="p-3">الكتاب</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">الطلب</th>
                    <th className="p-3">ملاحظات</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-bold">{m.book.title}</td>
                      <td className="p-3">{MOVEMENT_TYPE_LABELS[m.type] ?? m.type}</td>
                      <td className="p-3">
                        <span className={cn("font-extrabold", m.quantity > 0 ? "text-accent" : "text-red-600")}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="p-3">
                        {m.order ? (
                          <Link href={`/admin/orders/${m.order.id}`} className="text-brand hover:underline">
                            {m.order.customerName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-xs truncate p-3">{m.note ?? "—"}</td>
                      <td className="p-3 text-muted">
                        {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(m.createdAt)}
                      </td>
                      <td className="p-3">
                        <DeleteStockMovementButton id={m.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
