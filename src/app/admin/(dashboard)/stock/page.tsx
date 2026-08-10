import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import { storeNoun } from "@/lib/store-noun";
import { getStockLevels, getOrdersForSelect } from "@/lib/data";
import { StockMovementForm } from "@/components/admin/StockMovementForm";
import { DeleteStockMovementButton } from "@/components/admin/DeleteStockMovementButton";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/utils";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function AdminStockPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const d = getDictionary(store.uiLocale as Locale);
  const { singular } = storeNoun(store);

  const [stockLevels, orders, movements] = await Promise.all([
    getStockLevels(store.id),
    getOrdersForSelect(store.id),
    prisma.stockMovement.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      include: {
        book: { select: { title: true, coverImage: true } },
        order: { select: { id: true, customerName: true } },
      },
    }),
  ]);

  const totalUnits = stockLevels.reduce((sum, b) => sum + b.currentStock, 0);
  const totalValue = stockLevels.reduce((sum, b) => sum + b.currentStock * b.priceMinor, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">{t(d, "admin.stock.title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">{t(d, "admin.stock.totalUnits")}</p>
          <p className="mt-2 text-2xl font-extrabold text-brand">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">{t(d, "admin.stock.totalValue")}</p>
          <Price
            minor={totalValue}
            currency={store.currency}
            locale={store.uiLocale}
            className="mt-2 block text-2xl font-extrabold text-brand"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">{t(d, "admin.stock.currentStockHeading", { singular })}</h2>
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

      <StockMovementForm books={stockLevels} orders={orders} itemNounSingular={singular} />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">{t(d, "admin.stock.historyHeading")}</h2>
        {movements.length === 0 ? (
          <p className="text-muted">{t(d, "admin.stock.empty")}</p>
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
                    <span>{t(d, `admin.stock.movementTypes.${m.type}`)}</span>
                    <span>{new Intl.DateTimeFormat(store.uiLocale, { dateStyle: "short" }).format(m.createdAt)}</span>
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
                  <tr className="border-b border-border text-start text-muted">
                    <th className="p-3">{t(d, "admin.stock.table.item", { singular })}</th>
                    <th className="p-3">{t(d, "admin.stock.table.type")}</th>
                    <th className="p-3">{t(d, "admin.stock.table.quantity")}</th>
                    <th className="p-3">{t(d, "admin.stock.table.order")}</th>
                    <th className="p-3">{t(d, "admin.stock.table.notes")}</th>
                    <th className="p-3">{t(d, "admin.stock.table.date")}</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-bold">{m.book.title}</td>
                      <td className="p-3">{t(d, `admin.stock.movementTypes.${m.type}`)}</td>
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
                        {new Intl.DateTimeFormat(store.uiLocale, { dateStyle: "short" }).format(m.createdAt)}
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
