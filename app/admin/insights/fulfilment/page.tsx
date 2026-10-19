import type { Metadata } from "next";
import Link from "next/link";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { InsightsToolbar } from "@/components/admin/insights/InsightsToolbar";
import { KpiTile } from "@/components/admin/insights/KpiTile";
import { shortOrderId } from "@/lib/config/orders";
import { getFulfilment, getInsightsContext } from "@/lib/server/insights";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { formatHours } from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Fulfilment · Insights" };

const PATH = "/admin/insights/fulfilment";

export default async function InsightsFulfilmentPage({
  searchParams,
}: PageProps<"/admin/insights/fulfilment">) {
  const ctx = await getInsightsContext(await searchParams);
  const f = await getFulfilment(ctx);
  const stages = [
    { label: "Paid to packed", d: f.to_pack },
    { label: "Paid to shipped", d: f.to_ship },
    { label: "In transit", d: f.in_transit },
    { label: "Paid to delivered", d: f.to_deliver },
  ];

  return (
    <div className="space-y-6">
      <InsightsToolbar ctx={ctx} path={PATH} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stages.map(({ label, d }) => (
          <li key={label}>
            <KpiTile
              label={label}
              value={d.median === null ? "–" : formatHours(d.median)}
              detail={
                d.p90 === null
                  ? "No orders reached this yet"
                  : `Typical time; 1 in 10 take over ${formatHours(d.p90)}`
              }
            />
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        Over {f.orders} paid {f.orders === 1 ? "order" : "orders"} in this range. Times run from the
        moment an order is paid to when its status was changed in Orders.
      </p>

      <InsightsSection
        id="fulfilment-stuck"
        title="Waiting to be packed"
        description="Paid more than 48 hours ago and still not packed, whenever they were paid."
        action={
          <Link href="/admin/orders?view=todo" className="font-semibold text-accent underline">
            Orders to pack
          </Link>
        }
      >
        {f.stuck.length ? (
          <ul className="divide-y divide-border">
            {f.stuck.map((o) => (
              <li key={o.id}>
                {ctx.demo ? (
                  <div className="flex justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-semibold">{shortOrderId(o.id)}</span>{" "}
                      <span className="text-muted">paid {formatIstDateTime(o.paid_at)}</span>
                    </span>
                    <span className="tabular-nums">{formatMoney(o.total_paise)}</span>
                  </div>
                ) : (
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex justify-between gap-3 py-2 text-sm hover:bg-surface"
                  >
                    <span>
                      <span className="font-semibold">{shortOrderId(o.id)}</span>{" "}
                      <span className="text-muted">paid {formatIstDateTime(o.paid_at)}</span>
                    </span>
                    <span className="tabular-nums">{formatMoney(o.total_paise)}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Nothing is waiting. Every paid order has been packed within 48 hours.
          </p>
        )}
      </InsightsSection>
    </div>
  );
}
