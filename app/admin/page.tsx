import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, orderStatusBadge } from "@/components/admin/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { shortOrderId } from "@/lib/config/orders";
import { requireAdmin } from "@/lib/server/auth";
import { daysAgoIso, formatIstDateTime } from "@/lib/utils/datetime";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Dashboard" };

const PAID_STATUSES = ["paid", "packed", "shipped", "delivered"] as const;

/** Midnight today in India, as an ISO timestamp. */
function startOfTodayIst(): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return new Date(`${today}T00:00:00+05:30`).toISOString();
}

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const today = startOfTodayIst();
  const monthAgo = daysAgoIso(30);
  const count = { count: "exact", head: true } as const;

  const [todayOrders, toPack, refunds, listed, drafts, soldMonth, recent] = await Promise.all([
    supabase
      .from("orders")
      .select("total_paise")
      .in("status", [...PAID_STATUSES])
      .gte("paid_at", today),
    supabase.from("orders").select("id", count).eq("status", "paid"),
    supabase
      .from("order_items")
      .select("order_id, orders!inner(status)", count)
      .eq("unavailable", true)
      .in("orders.status", ["paid", "packed", "shipped", "delivered"]),
    supabase.from("products").select("id", count).in("status", ["available", "reserved"]),
    supabase.from("products").select("id", count).eq("status", "draft"),
    supabase.from("products").select("id", count).eq("status", "sold").gte("sold_at", monthAgo),
    supabase
      .from("orders")
      .select("id, status, created_at, total_paise")
      .neq("status", "pending")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const failed = [todayOrders, toPack, refunds, listed, drafts, soldMonth, recent].find(
    (r) => r.error,
  );
  if (failed?.error) throw new Error(`dashboard: ${failed.error.message}`);

  const revenueToday = (todayOrders.data ?? []).reduce((sum, o) => sum + o.total_paise, 0);
  const tiles = [
    { label: "Orders today", value: String(todayOrders.data?.length ?? 0) },
    { label: "Revenue today", value: formatMoney(revenueToday) },
    { label: "To pack", value: String(toPack.count ?? 0), href: "/admin/orders?view=todo" },
    {
      label: "Pieces needing refunds",
      value: String(refunds.count ?? 0),
      href: "/admin/orders?view=refund",
      alert: (refunds.count ?? 0) > 0,
    },
    {
      label: "Listed now",
      value: String(listed.count ?? 0),
      href: "/admin/products?status=available",
    },
    {
      label: "Sold, last 30 days",
      value: String(soldMonth.count ?? 0),
      href: "/admin/products?status=sold",
    },
    { label: "Drafts", value: String(drafts.count ?? 0), href: "/admin/products?status=draft" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={<ButtonLink href="/admin/products/new">New product</ButtonLink>}
      />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map((tile) => {
          const body = (
            <>
              <span className="block text-sm text-muted">{tile.label}</span>
              <span
                className={
                  tile.alert
                    ? "mt-1 block font-display text-3xl font-bold text-sale"
                    : "mt-1 block font-display text-3xl font-bold"
                }
              >
                {tile.value}
              </span>
            </>
          );
          return (
            <li key={tile.label}>
              {tile.href ? (
                <Link
                  href={tile.href}
                  className="block h-full rounded-lg border border-border p-4 hover:border-fg"
                >
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-lg border border-border p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="recent" className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent" className="text-lg font-bold">
            Recent orders
          </h2>
          <Link
            href="/admin/orders?view=all"
            className="text-sm font-semibold text-accent underline"
          >
            All orders
          </Link>
        </div>
        {recent.data?.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {recent.data.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface"
                >
                  <span>
                    <span className="font-semibold">{shortOrderId(o.id)}</span>{" "}
                    <span className="text-sm text-muted">{formatIstDateTime(o.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge {...orderStatusBadge[o.status]} />
                    <span className="font-semibold">{formatMoney(o.total_paise)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-border p-8 text-center text-muted">
            No orders yet.
          </p>
        )}
      </section>
    </>
  );
}
