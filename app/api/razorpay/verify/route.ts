import { NextResponse, type NextRequest } from "next/server";
import type { VerifyResult } from "@/lib/checkout/types";
import { getUser } from "@/lib/server/auth";
import { finalisePaidOrder } from "@/lib/server/orders";
import { getRazorpayConfig, verifyPaymentSignature } from "@/lib/server/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRequestSchema } from "@/lib/validators/checkout";

// Step 5 of CLAUDE.md §9: Razorpay Checkout's success handler posts here. The signature proves
// the payment belongs to the Razorpay order we created for this order id. The webhook does the
// same independently (and is the source of truth); mark_order_paid makes the pair idempotent.

function fail(status: number, message: string) {
  return NextResponse.json<VerifyResult>({ ok: false, message }, { status });
}

export async function POST(request: NextRequest) {
  const razorpay = getRazorpayConfig();
  if (!razorpay) return fail(503, "Payments aren't set up.");

  const parsed = verifyRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "That payment response wasn't valid.");
  const body = parsed.data;

  const { user } = await getUser();
  if (!user) return fail(401, "Sign in again to see your order.");

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, user_id, razorpay_order_id")
    .eq("id", body.orderId)
    .maybeSingle();
  if (
    !order ||
    order.user_id !== user.id ||
    order.razorpay_order_id !== body.razorpay_order_id ||
    !verifyPaymentSignature(razorpay, {
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    })
  ) {
    return fail(
      400,
      "We couldn't verify that payment. If you were charged, contact us with your order number.",
    );
  }

  try {
    await finalisePaidOrder(order.id, body.razorpay_payment_id);
  } catch (error) {
    // The webhook will retry; the order page shows "confirming" until it lands.
    console.error("[verify]", error);
  }
  return NextResponse.json<VerifyResult>({ ok: true, orderId: order.id });
}
