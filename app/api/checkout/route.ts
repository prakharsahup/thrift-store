import { NextResponse, type NextRequest } from "next/server";
import type { CheckoutFailed, CheckoutStarted } from "@/lib/checkout/types";
import { getUser } from "@/lib/server/auth";
import { applyCoupon, setRazorpayOrderId, startCheckout } from "@/lib/server/orders";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/server/payments";
import { addressSchema, checkoutRequestSchema } from "@/lib/validators/checkout";

// Step 2–3 of CLAUDE.md §9: hold the cart, create the pending order from database prices, apply
// the coupon, and create the matching Razorpay order. The browser then opens Razorpay Checkout.
// If a later step fails, the pending order is left as it is: the shopper keeps their holds, the
// next attempt replaces the order (start_checkout), and cron cancels abandoned ones.

function fail(status: number, body: Omit<CheckoutFailed, "ok">) {
  return NextResponse.json<CheckoutFailed>({ ok: false, ...body }, { status });
}

/** Razorpay's smallest charge is ₹1. */
const MIN_CHARGE_PAISE = 100;

export async function POST(request: NextRequest) {
  const razorpay = getRazorpayConfig();
  if (!razorpay) {
    return fail(503, {
      message: "Online payments aren't switched on yet. Please try again later.",
    });
  }

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return fail(400, { message: "Something's off with your order. Refresh and try again." });
  const { productIds, addressId, couponCode } = parsed.data;

  const { supabase, user } = await getUser();
  if (!user) return fail(401, { message: "Sign in to check out.", needsLogin: true });

  // RLS: only the user's own addresses are visible.
  const [{ data: addressRow }, { data: profile }] = await Promise.all([
    supabase
      .from("addresses")
      .select("name, phone, line1, line2, city, state, pincode")
      .eq("id", addressId)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
  ]);
  const address = addressSchema.safeParse({ ...addressRow, line2: addressRow?.line2 ?? "" });
  if (!addressRow || !address.success) {
    return fail(400, { message: "Choose a delivery address." });
  }

  const started = await startCheckout({ userId: user.id, productIds, address: address.data });
  if (!started.ok) {
    return fail(409, {
      message:
        started.unavailableProductIds.length === 1
          ? "One piece was just taken by someone else, so we've removed it."
          : `${started.unavailableProductIds.length} pieces were just taken by someone else, so we've removed them.`,
      unavailableProductIds: started.unavailableProductIds,
    });
  }

  let amountPaise = started.totalPaise;
  if (couponCode) {
    const coupon = await applyCoupon(started.orderId, couponCode);
    if (!coupon.ok) {
      return fail(422, { message: coupon.message, field: "coupon" });
    }
    amountPaise = coupon.totalPaise;
  }

  if (amountPaise < MIN_CHARGE_PAISE) {
    return fail(422, { message: "This order's total is too low to pay online." });
  }

  let razorpayOrderId: string;
  try {
    razorpayOrderId = await createRazorpayOrder(razorpay, {
      id: started.orderId,
      amountPaise,
    });
    await setRazorpayOrderId(started.orderId, razorpayOrderId);
  } catch (error) {
    console.error("[checkout] Razorpay order:", error);
    return fail(502, {
      message: "We couldn't reach the payment provider. Nothing was charged — please try again.",
    });
  }

  return NextResponse.json<CheckoutStarted>({
    ok: true,
    orderId: started.orderId,
    razorpayOrderId,
    keyId: razorpay.keyId,
    amountPaise,
    reservedUntil: started.reservedUntil,
    prefill: {
      name: profile?.full_name ?? address.data.name,
      email: user.email ?? "",
      contact: profile?.phone ?? `+91${address.data.phone}`,
    },
  });
}
