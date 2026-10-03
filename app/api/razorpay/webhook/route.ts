import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { finalisePaidOrder, releaseOrderHolds } from "@/lib/server/orders";
import { verifyWebhookSignature } from "@/lib/server/payments";
import { createAdminClient } from "@/lib/supabase/admin";

// Step 6 of CLAUDE.md §9 — the source of truth for payments. Razorpay calls this for every
// subscribed event (Dashboard → Webhooks: payment.captured, payment.failed). Answers 2xx for
// anything it has handled or deliberately ignores, and 5xx when Razorpay should retry.

const paymentEventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string().nullable(),
        method: z.string().nullable().optional(),
      }),
    }),
  }),
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = paymentEventSchema.safeParse(json);
  // Signed, but not a payment event we use.
  if (!parsed.success) return NextResponse.json({ ok: true, ignored: true });

  const { event } = parsed.data;
  const payment = parsed.data.payload.payment.entity;
  if (event !== "payment.captured" && event !== "payment.failed") {
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (!payment.order_id) return NextResponse.json({ ok: true, ignored: true });

  const { data: order, error } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  // Not one of ours (e.g. another integration on the same Razorpay account).
  if (!order) return NextResponse.json({ ok: true, ignored: true });

  try {
    if (event === "payment.captured") {
      await finalisePaidOrder(order.id, payment.id, payment.method ?? undefined);
    } else {
      await releaseOrderHolds(order.id);
    }
  } catch (err) {
    console.error(`[webhook] ${event} for order ${order.id}:`, err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
