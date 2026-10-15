import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, orderStatusBadge } from "@/components/admin/StatusBadge";
import { shortOrderId } from "@/lib/config/orders";
import { requireAdmin } from "@/lib/server/auth";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Orders" };

const views = {
  todo: { label: "To pack", statuses: ["paid"] },
  packed: { label: "Packed", statuses: ["packed"] },
  shipped: { label: "Shipped", statuses: ["shipped"] },
  all: { label: "All paid", statuses: ["paid", "packed", "shipped", "delivered", "refunded"] },
  refund: {
    label: "Refund due",
    statuses: ["paid", "packed", "shipped", "delivered", "cancelled"],
  },
  pending: { label: "Unpaid", statuses: ["pending", "cancelled"] },
} as const;
type View = keyof typeof views;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const view: View = viewParam && viewParam in views ? (viewParam as View) : "todo";

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, total_paise, razorpay_payment_id, address, order_items(unavailable)",
    )
    .in("status", [...views[view].statuses])
    // Work queues oldest first (pack in order); history newest first.
    .order("created_at", { ascending: view === "todo" || view === "packed" })
    .limit(200);
  if (error) throw new Error(`admin orders: ${error.message}`);

  // A refund is due when a paid order includes pieces that sold to someone else first, or when a
  // payment landed on an order that had already been cancelled.
  const refundDue = (o: (typeof data)[number]) =>
    o.order_items.some((i) => i.unavailable) ||
    (o.status === "cancelled" && o.razorpay_payment_id !== null);
  const orders = view === "refund" ? data.filter(refundDue) : data;

  return (
    <>
      <PageHeader title="Orders" />
      <nav aria-label="Order views" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(views) as View[]).map((key) => (
          <Link
            key={key}
            href={`/admin/orders?view=${key}`}
            aria-current={key === view ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-semibold",
              key === view ? "border-fg bg-fg text-bg" : "border-border hover:border-fg",
            )}
          >
            {views[key].label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-border p-8 text-center text-muted">
          Nothing here right now.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {orders.map((o) => {
            const name =
              typeof o.address === "object" &&
              o.address !== null &&
              !Array.isArray(o.address) &&
              typeof o.address.name === "string"
                ? o.address.name
                : "—";
            const count = o.order_items.length;
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {shortOrderId(o.id)} · {name}
                    </span>
                    <span className="block text-sm text-muted">
                      {formatIstDateTime(o.created_at)} · {count} piece{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    {refundDue(o) ? <StatusBadge label="Refund due" tone="bad" /> : null}
                    <StatusBadge {...orderStatusBadge[o.status]} />
                    <span className="font-semibold">{formatMoney(o.total_paise)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
