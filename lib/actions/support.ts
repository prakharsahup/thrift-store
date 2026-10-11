"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { site } from "@/lib/config/site";
import { getUser } from "@/lib/server/auth";
import {
  sendEmail,
  supportAcknowledgementEmail,
  supportAlertEmail,
  supportInbox,
} from "@/lib/server/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { supportRequestSchema } from "@/lib/validators/support";

export type SupportFormState = {
  status: "idle" | "sent" | "error";
  message: string;
  ticket?: string;
  fieldErrors?: Partial<
    Record<"name" | "email" | "phone" | "topic" | "orderRef" | "message", string>
  >;
};

/** A one-way hash of the sender's IP, used only to rate-limit the form (5 messages an hour). */
async function clientKey(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? createHash("sha256").update(`support:${ip}`).digest("hex") : null;
}

/**
 * Contact form / grievance submission. Saves the message as a ticket, emails the sender an
 * acknowledgement with the ticket number straight away, and alerts the support inbox.
 */
export async function submitSupportRequest(
  _previous: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  // Honeypot: people never see or fill this field; bots often do. Pretend it worked.
  if (formData.get("website")) {
    return { status: "sent", message: "Thanks — we've got your message." };
  }

  const parsed = supportRequestSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    topic: formData.get("topic") ?? "",
    orderRef: formData.get("orderRef") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: {
        name: errors.name?.[0],
        email: errors.email?.[0],
        phone: errors.phone?.[0],
        topic: errors.topic?.[0],
        orderRef: errors.orderRef?.[0],
        message: errors.message?.[0],
      },
    };
  }
  const form = parsed.data;
  const { user } = await getUser();

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("submit_support_request", {
    name: form.name,
    email: form.email,
    topic: form.topic,
    message: form.message,
    phone: form.phone ?? undefined,
    order_ref: form.orderRef ?? undefined,
    user_id: user?.id,
    client_key: (await clientKey()) ?? undefined,
  });
  const result = data as { ok: true; id: string; ticket: string } | { ok: false } | null;
  if (error || !result) {
    console.error("[support] submit failed:", error);
    return {
      status: "error",
      message: "We couldn't send that just now. Try again, or email us directly.",
    };
  }
  if (!result.ok) {
    return {
      status: "error",
      message: "You've sent a few messages already. Wait an hour, or email us directly.",
    };
  }

  const message = { ...form, ticket: result.ticket };
  // acknowledged_at records that the customer really got their ticket number; if the email
  // couldn't be sent, the admin inbox shows the ticket as not yet acknowledged.
  if (await sendEmail({ to: form.email, ...supportAcknowledgementEmail(message) })) {
    await admin
      .from("support_requests")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", result.id);
  }

  const inbox = supportInbox();
  if (inbox) {
    await sendEmail({
      to: inbox,
      ...supportAlertEmail({ ...message, adminUrl: `${site.url}/admin/messages/${result.id}` }),
    });
  }

  return {
    status: "sent",
    ticket: result.ticket,
    message: `Thanks — your ticket number is ${result.ticket}. We've emailed you a copy.`,
  };
}
