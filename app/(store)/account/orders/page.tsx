import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatOrderDate, orderStatuses, shortOrderId } from "@/lib/config/orders";
import { requireUser } from "@/lib/server/auth";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

// Order history (RLS: own orders only). Abandoned checkouts — cancelled before any payment — are
// left out; they were never really orders.
export default async function OrdersPage() {
  const { supabase } = await requireUser("/account/orders");
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, total_paise, razorpay_payment_id, order_items(count)")
    .or("status.neq.cancelled,razorpay_payment_id.not.is.null")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error(`[orders] ${error.message}`);
  const orders = data ?? [];

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Orders" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold md:text-3xl">Orders</h1>

      {orders.length === 0 ? (
        <div className="flex max-w-md flex-col items-start gap-4 py-12">
          <Package aria-hidden className="size-10 text-muted" />
          <p className="text-muted">No orders yet. When you buy something, it shows up here.</p>
          <ButtonLink href="/search?sort=newest">Shop new arrivals</ButtonLink>
        </div>
      ) : (
        <ul className="mt-6 max-w-2xl divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => {
            const count = order.order_items[0]?.count ?? 0;
            return (
              <li key={order.id}>
                <Link
                  href={`/order/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-4 hover:bg-surface md:px-6"
                >
                  <span>
                    <span className="block font-semibold">{shortOrderId(order.id)}</span>
                    <span className="block text-sm text-muted">
                      {formatOrderDate(order.created_at)} · {count} piece{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold">{formatMoney(order.total_paise)}</span>
                    <span className="block text-sm text-muted">
                      {orderStatuses[order.status].label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
