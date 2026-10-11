import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { grievanceOfficer } from "@/lib/config/legal";
import { requireAdmin } from "@/lib/server/auth";
import { cn } from "@/lib/utils/cn";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { supportStatuses, supportTopics } from "@/lib/validators/support";

export const metadata: Metadata = { title: "Messages" };

const views = {
  open: { label: "Open", statuses: ["open", "in_progress"] },
  resolved: { label: "Resolved", statuses: ["resolved"] },
} as const;
type View = keyof typeof views;

const DAY_MS = 86_400_000;

/** Days until the 30-day resolution deadline (negative = overdue). */
function daysLeft(createdAt: string): number {
  return Math.ceil(
    (new Date(createdAt).getTime() + grievanceOfficer.resolveWithinDays * DAY_MS - Date.now()) /
      DAY_MS,
  );
}

// Contact-form messages and grievances. Open tickets list oldest first, with the legal deadline:
// every complaint must be resolved within a month (E-Commerce Rules 2020 r. 4(5)).
export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const view: View = viewParam && viewParam in views ? (viewParam as View) : "open";

  const { data, error } = await supabase
    .from("support_requests")
    .select("id, ticket, name, topic, order_ref, status, created_at, resolved_at")
    .in("status", [...views[view].statuses])
    .order("created_at", { ascending: view === "open" })
    .limit(200);
  if (error) throw new Error(`admin messages: ${error.message}`);

  return (
    <>
      <PageHeader title="Messages">
        <p className="mt-2 max-w-prose text-sm text-muted">
          Senders get a ticket number by email automatically. Complaints must be resolved within{" "}
          {grievanceOfficer.resolveWithinDays} days; resolving a ticket emails the customer your
          note.
        </p>
      </PageHeader>
      <nav aria-label="Message views" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(views) as View[]).map((key) => (
          <Link
            key={key}
            href={`/admin/messages?view=${key}`}
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

      {data.length === 0 ? (
        <p className="rounded-lg border border-border p-8 text-center text-muted">
          Nothing here right now.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {data.map((m) => {
            const left = daysLeft(m.created_at);
            return (
              <li key={m.id}>
                <Link
                  href={`/admin/messages/${m.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {m.ticket} · {m.name}
                    </span>
                    <span className="block text-sm text-muted">
                      {formatIstDateTime(m.created_at)} · {supportTopics[m.topic]}
                      {m.order_ref ? ` · Order ${m.order_ref}` : ""}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    {m.topic === "grievance" ? <StatusBadge label="Grievance" tone="warn" /> : null}
                    {m.status !== "resolved" ? (
                      <StatusBadge
                        label={left < 0 ? `Overdue ${-left}d` : `${left}d left`}
                        tone={left <= 5 ? "bad" : "neutral"}
                      />
                    ) : null}
                    <StatusBadge
                      label={supportStatuses[m.status]}
                      tone={
                        m.status === "resolved" ? "muted" : m.status === "open" ? "warn" : "neutral"
                      }
                    />
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
