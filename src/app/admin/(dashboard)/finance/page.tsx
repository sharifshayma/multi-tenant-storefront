import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/lib/store-context";
import {
  getFinanceSummary,
  getOrdersForSelect,
  getForecastedRevenue,
  getDiscountSummary,
} from "@/lib/data";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { DeleteTransactionButton } from "@/components/admin/DeleteTransactionButton";
import { ForecastedRevenuePanel } from "@/components/admin/ForecastedRevenuePanel";
import { Price } from "@/components/ui/Price";
import { getDictionary, t, type Locale } from "@/i18n";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/login");
  const d = getDictionary(store.uiLocale as Locale);

  const [summary, orders, transactions, forecast, discounts] = await Promise.all([
    getFinanceSummary(store.id),
    getOrdersForSelect(store.id),
    prisma.transaction.findMany({
      where: { storeId: store.id },
      orderBy: { date: "desc" },
      include: { order: { select: { id: true, customerName: true } } },
    }),
    getForecastedRevenue(store.id),
    getDiscountSummary(store.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">{t(d, "admin.finance.title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">{t(d, "admin.finance.totalRevenue")}</p>
          <Price
            minor={summary.totalRevenue}
            currency={store.currency}
            locale={store.defaultLocale}
            className="mt-2 block text-2xl font-extrabold text-accent"
          />
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">{t(d, "admin.finance.totalExpense")}</p>
          <Price
            minor={summary.totalExpense}
            currency={store.currency}
            locale={store.defaultLocale}
            className="mt-2 block text-2xl font-extrabold text-red-600"
          />
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">{t(d, "admin.finance.net")}</p>
          <Price
            minor={summary.net}
            currency={store.currency}
            locale={store.defaultLocale}
            className={`mt-2 block text-2xl font-extrabold ${summary.net >= 0 ? "text-brand" : "text-red-600"}`}
          />
        </div>
      </div>

      <ForecastedRevenuePanel
        totalMinor={forecast.totalMinor}
        orders={forecast.orders}
        currency={store.currency}
        locale={store.defaultLocale}
      />

      <TransactionForm orders={orders} currency={store.currency} locale={store.defaultLocale} />

      {transactions.length === 0 ? (
        <p className="text-muted">{t(d, "admin.finance.empty")}</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      tx.type === "REVENUE" ? "bg-accent/10 text-accent" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {t(d, `admin.finance.types.${tx.type}`)}
                  </span>
                  <Price
                    minor={tx.amountMinor}
                    currency={store.currency}
                    locale={store.defaultLocale}
                    className={`font-extrabold ${tx.type === "REVENUE" ? "text-accent" : "text-red-600"}`}
                  />
                </div>
                {(tx.category || tx.description) && (
                  <p className="text-sm">
                    {tx.category && <span className="font-bold">{tx.category}</span>}
                    {tx.category && tx.description && " · "}
                    {tx.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>{new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(tx.date)}</span>
                  {tx.order && (
                    <Link href={`/admin/orders/${tx.order.id}`} className="text-brand hover:underline">
                      {tx.order.customerName}
                    </Link>
                  )}
                </div>
                <div className="flex justify-end pt-1">
                  <DeleteTransactionButton id={tx.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-end text-muted">
                  <th className="p-3">{t(d, "admin.finance.table.type")}</th>
                  <th className="p-3">{t(d, "admin.finance.table.amount")}</th>
                  <th className="p-3">{t(d, "admin.finance.table.category")}</th>
                  <th className="p-3">{t(d, "admin.finance.table.notes")}</th>
                  <th className="p-3">{t(d, "admin.finance.table.order")}</th>
                  <th className="p-3">{t(d, "admin.finance.table.date")}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          tx.type === "REVENUE" ? "bg-accent/10 text-accent" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {t(d, `admin.finance.types.${tx.type}`)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Price
                        minor={tx.amountMinor}
                        currency={store.currency}
                        locale={store.defaultLocale}
                        className={`font-extrabold ${tx.type === "REVENUE" ? "text-accent" : "text-red-600"}`}
                      />
                    </td>
                    <td className="p-3">{tx.category ?? "—"}</td>
                    <td className="max-w-xs truncate p-3">{tx.description ?? "—"}</td>
                    <td className="p-3">
                      {tx.order ? (
                        <Link href={`/admin/orders/${tx.order.id}`} className="text-brand hover:underline">
                          {tx.order.customerName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-muted">
                      {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(tx.date)}
                    </td>
                    <td className="p-3">
                      <DeleteTransactionButton id={tx.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {discounts.orders.length > 0 && (
        <details className="rounded-2xl border border-border bg-white px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold">
            <span className="text-muted">
              {t(d, "admin.finance.discounts.heading")}
              <span className="ms-1 text-ink">({discounts.orders.length})</span>
            </span>
            <Price
              minor={discounts.totalDiscountMinor}
              currency={store.currency}
              locale={store.defaultLocale}
              className="font-extrabold text-accent"
            />
          </summary>
          <div className="mt-3 overflow-x-auto border-t border-border pt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-end text-muted">
                  <th className="px-2 py-1.5 font-bold">{t(d, "admin.finance.table.order")}</th>
                  <th className="px-2 py-1.5 font-bold">{t(d, "admin.finance.discounts.amount")}</th>
                  <th className="px-2 py-1.5 font-bold">{t(d, "admin.finance.discounts.reason")}</th>
                  <th className="px-2 py-1.5 font-bold">{t(d, "admin.finance.table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {discounts.orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-2 py-1.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-brand hover:underline">
                        {o.customerName}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">
                      <Price
                        minor={o.discountMinor}
                        currency={store.currency}
                        locale={store.defaultLocale}
                        className="font-bold text-accent"
                      />
                    </td>
                    <td className="max-w-[12rem] truncate px-2 py-1.5 text-muted">
                      {o.discountReason ?? "—"}
                    </td>
                    <td className="px-2 py-1.5 text-muted">
                      {new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
