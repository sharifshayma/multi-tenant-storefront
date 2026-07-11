import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFinanceSummary, getOrdersForSelect, getForecastedRevenue } from "@/lib/data";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { DeleteTransactionButton } from "@/components/admin/DeleteTransactionButton";
import { ForecastedRevenuePanel } from "@/components/admin/ForecastedRevenuePanel";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const [summary, orders, transactions, forecast] = await Promise.all([
    getFinanceSummary(),
    getOrdersForSelect(),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: { order: { select: { id: true, customerName: true } } },
    }),
    getForecastedRevenue(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">المالية</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">إجمالي الإيرادات</p>
          <Price nis={summary.totalRevenue} className="mt-2 block text-2xl font-extrabold text-accent" />
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">إجمالي المصروفات</p>
          <Price nis={summary.totalExpense} className="mt-2 block text-2xl font-extrabold text-red-600" />
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">الصافي</p>
          <Price
            nis={summary.net}
            className={`mt-2 block text-2xl font-extrabold ${summary.net >= 0 ? "text-brand" : "text-red-600"}`}
          />
        </div>
      </div>

      <ForecastedRevenuePanel totalNis={forecast.totalNis} orders={forecast.orders} />

      <TransactionForm orders={orders} />

      {transactions.length === 0 ? (
        <p className="text-muted">لا توجد حركات مالية بعد.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {transactions.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      t.type === "REVENUE" ? "bg-accent/10 text-accent" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {t.type === "REVENUE" ? "إيراد" : "مصروف"}
                  </span>
                  <Price
                    nis={t.amountNis}
                    className={`font-extrabold ${t.type === "REVENUE" ? "text-accent" : "text-red-600"}`}
                  />
                </div>
                {(t.category || t.description) && (
                  <p className="text-sm">
                    {t.category && <span className="font-bold">{t.category}</span>}
                    {t.category && t.description && " · "}
                    {t.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>{new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(t.date)}</span>
                  {t.order && (
                    <Link href={`/admin/orders/${t.order.id}`} className="text-brand hover:underline">
                      {t.order.customerName}
                    </Link>
                  )}
                </div>
                <div className="flex justify-end pt-1">
                  <DeleteTransactionButton id={t.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-muted">
                  <th className="p-3">النوع</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">ملاحظات</th>
                  <th className="p-3">الطلب</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          t.type === "REVENUE" ? "bg-accent/10 text-accent" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {t.type === "REVENUE" ? "إيراد" : "مصروف"}
                      </span>
                    </td>
                    <td className="p-3">
                      <Price
                        nis={t.amountNis}
                        className={`font-extrabold ${t.type === "REVENUE" ? "text-accent" : "text-red-600"}`}
                      />
                    </td>
                    <td className="p-3">{t.category ?? "—"}</td>
                    <td className="max-w-xs truncate p-3">{t.description ?? "—"}</td>
                    <td className="p-3">
                      {t.order ? (
                        <Link href={`/admin/orders/${t.order.id}`} className="text-brand hover:underline">
                          {t.order.customerName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-muted">
                      {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(t.date)}
                    </td>
                    <td className="p-3">
                      <DeleteTransactionButton id={t.id} />
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
