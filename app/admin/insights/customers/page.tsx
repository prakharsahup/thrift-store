import type { Metadata } from "next";
import { BarList } from "@/components/admin/insights/BarList";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { InsightsToolbar } from "@/components/admin/insights/InsightsToolbar";
import { KpiTile } from "@/components/admin/insights/KpiTile";
import { getCustomers, getInsightsContext, getSummary } from "@/lib/server/insights";
import { change, deriveKpis, formatCount, formatPercent } from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Customers · Insights" };

const PATH = "/admin/insights/customers";

export default async function InsightsCustomersPage({
  searchParams,
}: PageProps<"/admin/insights/customers">) {
  const ctx = await getInsightsContext(await searchParams);
  const [customers, summary] = await Promise.all([getCustomers(ctx), getSummary(ctx)]);
  const now = deriveKpis(summary.current);
  const before = deriveKpis(summary.previous);
  const orders = summary.current.orders;
  const places = (rows: typeof customers.states) =>
    rows.map((r) => ({
      label: r.key,
      value: r.orders,
      display: `${r.orders} ${r.orders === 1 ? "order" : "orders"}`,
      detail: formatMoney(r.revenue_paise),
    }));

  return (
    <div className="space-y-6">
      <InsightsToolbar ctx={ctx} path={PATH} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <KpiTile
            label="Buyers"
            value={formatCount(now.buyers)}
            change={change(now.buyers, before.buyers)}
          />
        </li>
        <li>
          <KpiTile
            label="First-time buyers"
            value={formatCount(now.newBuyers)}
            change={change(now.newBuyers, before.newBuyers)}
            detail={
              now.buyers ? `${formatPercent(now.newBuyers / now.buyers)} of buyers` : undefined
            }
          />
        </li>
        <li>
          <KpiTile
            label="Orders from returning buyers"
            value={orders ? formatPercent(customers.orders_from_returning / orders) : "–"}
            detail={`${customers.orders_from_returning} of ${orders} orders`}
          />
        </li>
        <li>
          <KpiTile
            label="Ever bought twice or more"
            value={
              customers.lifetime_buyers
                ? formatPercent(customers.lifetime_repeat_buyers / customers.lifetime_buyers)
                : "–"
            }
            detail={`${customers.lifetime_repeat_buyers} of ${customers.lifetime_buyers} buyers, all time`}
          />
        </li>
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsSection id="customers-states" title="Top states" description="Where orders ship.">
          <BarList items={places(customers.states)} />
        </InsightsSection>
        <InsightsSection id="customers-cities" title="Top cities">
          <BarList items={places(customers.cities)} />
        </InsightsSection>
      </div>

      <InsightsSection
        id="customers-top"
        title="Top buyers"
        description="By spend in this range. Emails are shortened here; full details are on each order."
      >
        {customers.top_buyers.length ? (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    Buyer
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Orders
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Spent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.top_buyers.map((b, i) => (
                  <tr key={i}>
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {b.email}
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">{b.orders}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(b.spent_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">No buyers in this range yet.</p>
        )}
      </InsightsSection>
    </div>
  );
}
