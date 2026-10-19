import type { Metadata } from "next";
import Link from "next/link";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { InsightsToolbar } from "@/components/admin/insights/InsightsToolbar";
import { KpiTile } from "@/components/admin/insights/KpiTile";
import { getInsightsContext, getMarketing, getSummary } from "@/lib/server/insights";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { formatPercent } from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Coupons & drops · Insights" };

const PATH = "/admin/insights/marketing";

export default async function InsightsMarketingPage({
  searchParams,
}: PageProps<"/admin/insights/marketing">) {
  const ctx = await getInsightsContext(await searchParams);
  const [marketing, summary] = await Promise.all([getMarketing(ctx), getSummary(ctx)]);
  const orders = summary.current.orders;
  const discount = marketing.coupons.reduce((sum, c) => sum + c.discount_paise, 0);

  return (
    <div className="space-y-6">
      <InsightsToolbar ctx={ctx} path={PATH} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <li>
          <KpiTile
            label="Orders with a coupon"
            value={orders ? formatPercent(marketing.coupon_orders / orders) : "–"}
            detail={`${marketing.coupon_orders} of ${orders} orders`}
          />
        </li>
        <li>
          <KpiTile label="Given away in discounts" value={formatMoney(discount)} />
        </li>
        <li>
          <KpiTile
            label="Drops that went live"
            value={String(marketing.drops.length)}
            detail="In this range"
          />
        </li>
      </ul>

      <InsightsSection
        id="marketing-coupons"
        title="Coupons"
        description="Revenue is the total paid on orders that used the code."
        action={
          <Link href="/admin/coupons" className="font-semibold text-accent underline">
            Manage coupons
          </Link>
        }
      >
        {marketing.coupons.length ? (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    Code
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Uses
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Discount given
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Revenue
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Revenue per ₹1 off
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {marketing.coupons.map((c) => (
                  <tr key={c.code}>
                    <th scope="row" className="px-3 py-2 text-left">
                      <span className="font-semibold">{c.code}</span>
                      <span className="ml-2 text-xs font-normal text-muted">
                        {c.type === "percent"
                          ? `${c.value}% off`
                          : c.type === "flat" && c.value !== null
                            ? `${formatMoney(c.value)} off`
                            : "Deleted coupon"}
                      </span>
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">{c.uses}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(c.discount_paise)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(c.revenue_paise)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {c.discount_paise
                        ? `₹${(c.revenue_paise / c.discount_paise).toFixed(1)}`
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">No coupons used in this range.</p>
        )}
      </InsightsSection>

      <InsightsSection
        id="marketing-drops"
        title="Drops"
        description="Drops that went live in this range, and everything they've sold since."
        action={
          <Link href="/admin/drops" className="font-semibold text-accent underline">
            Manage drops
          </Link>
        }
      >
        {marketing.drops.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {marketing.drops.map((d) => (
              <li key={d.id} className="rounded-lg border border-border bg-surface p-4">
                <p className="font-display text-lg font-bold">{d.name}</p>
                <p className="text-xs text-muted">Went live {formatIstDateTime(d.go_live_at)}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Sold</dt>
                    <dd className="font-semibold tabular-nums">
                      {d.sold} of {d.pieces}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Revenue</dt>
                    <dd className="font-semibold tabular-nums">{formatMoney(d.revenue_paise)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">First 24 hours</dt>
                    <dd className="font-semibold tabular-nums">{d.sold_first_day} sold</dd>
                  </div>
                  <div>
                    <dt className="text-muted">First week</dt>
                    <dd className="font-semibold tabular-nums">{d.sold_first_week} sold</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted">Asked to be notified</dt>
                    <dd className="font-semibold tabular-nums">{d.notify_signups} people</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No drops went live in this range.</p>
        )}
      </InsightsSection>
    </div>
  );
}
