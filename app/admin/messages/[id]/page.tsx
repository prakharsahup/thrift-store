import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SupportTicketForm } from "@/components/admin/SupportTicketForm";
import { requireAdmin } from "@/lib/server/auth";
import { formatIstDateTime } from "@/lib/utils/datetime";
import { supportStatuses, supportTopics } from "@/lib/validators/support";

export const metadata: Metadata = { title: "Message" };

export default async function AdminMessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireAdmin();

  const { data: m } = await supabase
    .from("support_requests")
    .select(
      "id, ticket, user_id, name, email, phone, topic, order_ref, message, status, resolution, created_at, acknowledged_at, resolved_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  return (
    <>
      <PageHeader
        title={`Ticket ${m.ticket}`}
        crumbs={[{ label: "Messages", href: "/admin/messages" }]}
      >
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          {m.topic === "grievance" ? <StatusBadge label="Grievance" tone="warn" /> : null}
          <StatusBadge label={supportStatuses[m.status]} />
          <span>Received {formatIstDateTime(m.created_at)}</span>
          <span>
            {m.acknowledged_at
              ? `Acknowledged ${formatIstDateTime(m.acknowledged_at)}`
              : "Not acknowledged yet — reply within 48 hours"}
          </span>
          {m.resolved_at ? <span>Resolved {formatIstDateTime(m.resolved_at)}</span> : null}
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section
          aria-labelledby="message-body"
          className="rounded-lg border border-border p-4 md:p-6"
        >
          <h2 id="message-body" className="text-lg font-bold">
            {supportTopics[m.topic]}
          </h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">From</dt>
              <dd>
                {m.name}{" "}
                <a href={`mailto:${m.email}?subject=Re: ticket ${m.ticket}`} className="underline">
                  {m.email}
                </a>
              </dd>
            </div>
            {m.phone ? (
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{m.phone}</dd>
              </div>
            ) : null}
            {m.order_ref ? (
              <div>
                <dt className="text-muted">Order</dt>
                <dd>
                  {m.order_ref}{" "}
                  <Link href="/admin/orders?view=all" className="underline">
                    (find in orders)
                  </Link>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted">Account</dt>
              <dd>{m.user_id ? "Signed in when sent" : "Guest / signed out"}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-md bg-surface p-4 text-sm whitespace-pre-wrap">{m.message}</p>
        </section>

        <section
          aria-labelledby="message-update"
          className="rounded-lg border border-border p-4 md:p-6"
        >
          <h2 id="message-update" className="mb-4 text-lg font-bold">
            Handle it
          </h2>
          <SupportTicketForm requestId={m.id} status={m.status} resolution={m.resolution} />
        </section>
      </div>
    </>
  );
}
