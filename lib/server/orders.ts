import "server-only";
import { z } from "zod";
import { site } from "@/lib/config/site";
import { shipping } from "@/lib/config/shipping";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { formatMoney } from "@/lib/utils/money";
import type { AddressInput } from "@/lib/validators/checkout";
import {
  orderConfirmationEmail,
  orderNotificationEmail,
  orderNotificationInbox,
  sendEmail,
} from "./email";
import { revalidateStorefront } from "./revalidate";

// Order lifecycle on the server (CLAUDE.md §9). Everything here uses the service-role client and
// the SQL functions in supabase/migrations (start_checkout, apply_coupon, mark_order_paid…), which
// do the actual work atomically. Callers must have authenticated the user / verified the payment.

// ---------------------------------------------------------------------------
// Starting a checkout
// ---------------------------------------------------------------------------

const startCheckoutSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(false), unavailable_product_ids: z.array(z.string()) }),
  z.object({
    ok: z.literal(true),
    order_id: z.string(),
    subtotal_paise: z.number().int(),
    shipping_paise: z.number().int(),
    total_paise: z.number().int(),
    reserved_until: z.string(),
  }),
]);

export type StartedCheckout =
  | { ok: false; unavailableProductIds: string[] }
  | {
      ok: true;
      orderId: string;
      subtotalPaise: number;
      shippingPaise: number;
      totalPaise: number;
      reservedUntil: string;
    };

/** Holds the items and creates the pending order (prices from the database, never the client). */
export async function startCheckout(input: {
  userId: string;
  productIds: string[];
  address: AddressInput;
}): Promise<StartedCheckout> {
  const { data, error } = await createAdminClient().rpc("start_checkout", {
    user_id: input.userId,
    product_ids: input.productIds,
    address: input.address satisfies Record<string, Json>,
    shipping_flat_paise: shipping.flatPaise,
    free_shipping_above_paise: shipping.freeAbovePaise,
  });
  if (error) throw new Error(`start_checkout: ${error.message}`);
  const result = startCheckoutSchema.parse(data);
  return result.ok
    ? {
        ok: true,
        orderId: result.order_id,
        subtotalPaise: result.subtotal_paise,
        shippingPaise: result.shipping_paise,
        totalPaise: result.total_paise,
        reservedUntil: result.reserved_until,
      }
    : { ok: false, unavailableProductIds: result.unavailable_product_ids };
}

export async function setRazorpayOrderId(orderId: string, razorpayOrderId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("orders")
    .update({ razorpay_order_id: razorpayOrderId })
    .eq("id", orderId);
  if (error) throw new Error(`set razorpay_order_id: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

const couponResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(false),
    reason: z.enum(["invalid", "expired", "min_order", "used_up", "already_used"]),
    min_order_paise: z.number().int().optional(),
  }),
  z.object({
    ok: z.literal(true),
    discount_paise: z.number().int(),
    /** apply_coupon only: the order's new total. */
    total_paise: z.number().int().optional(),
  }),
]);

type CouponFailure = Extract<z.infer<typeof couponResultSchema>, { ok: false }>;

function couponErrorMessage(failure: CouponFailure): string {
  switch (failure.reason) {
    case "invalid":
      return "That code isn't valid.";
    case "expired":
      return "That code has expired.";
    case "min_order":
      return `That code needs an order of ${formatMoney(failure.min_order_paise ?? 0)} or more.`;
    case "used_up":
      return "That code has been fully used.";
    case "already_used":
      return "You've already used that code.";
  }
}

export type CouponQuote = { ok: true; discountPaise: number } | { ok: false; message: string };

/** What a coupon would take off this subtotal, without claiming it (the checkout preview). */
export async function quoteCoupon(
  code: string,
  userId: string,
  subtotalPaise: number,
): Promise<CouponQuote> {
  const { data, error } = await createAdminClient().rpc("coupon_quote", {
    code,
    user_id: userId,
    subtotal_paise: subtotalPaise,
  });
  if (error) throw new Error(`coupon_quote: ${error.message}`);
  const result = couponResultSchema.parse(data);
  return result.ok
    ? { ok: true, discountPaise: result.discount_paise }
    : { ok: false, message: couponErrorMessage(result) };
}

/** Claims a coupon for a pending order and recomputes its total. */
export async function applyCoupon(
  orderId: string,
  code: string,
): Promise<{ ok: true; totalPaise: number } | { ok: false; message: string }> {
  const { data, error } = await createAdminClient().rpc("apply_coupon", {
    order_id: orderId,
    code,
  });
  if (error) throw new Error(`apply_coupon: ${error.message}`);
  const result = couponResultSchema.parse(data);
  if (!result.ok) return { ok: false, message: couponErrorMessage(result) };
  if (result.total_paise === undefined) throw new Error("apply_coupon returned no total");
  return { ok: true, totalPaise: result.total_paise };
}

// ---------------------------------------------------------------------------
// Payment captured
// ---------------------------------------------------------------------------

const markPaidSchema = z.object({
  order_id: z.string(),
  status: z.string(),
  already_processed: z.boolean(),
  notify_late_payment: z.boolean(),
  unavailable_product_ids: z.array(z.string()),
});

const addressSnapshotSchema = z.object({
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});

/**
 * A payment landed on an order whose hold already expired and got auto-cancelled (CLAUDE.md §4;
 * cancel_stale_orders runs every 5 minutes) — it needs a manual refund. The verify route and the
 * webhook can both land here for the same late payment; mark_order_paid's
 * notify_late_payment makes this run exactly once per order.
 */
async function notifyLatePayment(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  paymentId: string,
): Promise<void> {
  const notifyInbox = orderNotificationInbox();
  if (!notifyInbox) return;

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, user_id, subtotal_paise, shipping_paise, discount_paise, total_paise, payment_method, address, order_items(title_snapshot, price_paise_snapshot, unavailable)",
    )
    .eq("id", orderId)
    .single();
  if (error) {
    console.error(`[orders] load cancelled order ${orderId} for late-payment alert: ${error.message}`);
    return;
  }
  const address = addressSnapshotSchema.safeParse(order.address);
  if (!address.success) return;

  const email = order.user_id
    ? (await admin.auth.admin.getUserById(order.user_id)).data.user?.email
    : undefined;

  await sendEmail({
    to: notifyInbox,
    ...orderNotificationEmail({
      id: order.id,
      status: "cancelled",
      customerEmail: email ?? null,
      items: order.order_items.map((i) => ({
        title: i.title_snapshot,
        pricePaise: i.price_paise_snapshot,
        unavailable: i.unavailable,
      })),
      subtotalPaise: order.subtotal_paise,
      shippingPaise: order.shipping_paise,
      discountPaise: order.discount_paise,
      totalPaise: order.total_paise,
      paymentMethod: order.payment_method,
      address: address.data,
      adminUrl: `${site.url}/admin/orders/${order.id}`,
      razorpayPaymentId: paymentId,
    }),
  });
}

/**
 * Marks the order paid and its items sold (mark_order_paid, idempotent). Called by both the
 * verify route and the webhook; only the first call does the follow-up work: clear the buyer's
 * cart, refresh cached pages, send the confirmation email.
 * Returns the order's status afterwards ("paid", or "cancelled" if the payment came too late and
 * must be refunded by hand).
 */
export async function finalisePaidOrder(
  orderId: string,
  paymentId: string,
  method?: string,
): Promise<{ status: string; alreadyProcessed: boolean }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("mark_order_paid", {
    order_id: orderId,
    payment_id: paymentId,
  });
  if (error) throw new Error(`mark_order_paid: ${error.message}`);
  const result = markPaidSchema.parse(data);

  if (result.status === "cancelled") {
    console.error(
      `[orders] payment ${paymentId} landed on cancelled order ${orderId}: refund it in the Razorpay dashboard`,
    );
    if (result.notify_late_payment) {
      await notifyLatePayment(admin, orderId, paymentId);
    }
  }
  // Only the webhook knows the method (UPI, card…), and it usually arrives after verify.
  if (method && result.status !== "cancelled") {
    await admin.from("orders").update({ payment_method: method }).eq("id", orderId);
  }
  if (result.already_processed) {
    return { status: result.status, alreadyProcessed: true };
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, user_id, subtotal_paise, shipping_paise, discount_paise, total_paise, payment_method, address, order_items(product_id, title_snapshot, price_paise_snapshot, unavailable, product:products(slug))",
    )
    .eq("id", orderId)
    .single();
  if (orderError) throw new Error(`load order ${orderId}: ${orderError.message}`);

  // The buyer's cart no longer needs these pieces. Other carts keep them and show them as sold.
  if (order.user_id) {
    await admin
      .from("cart_items")
      .delete()
      .eq("user_id", order.user_id)
      .in(
        "product_id",
        order.order_items.map((i) => i.product_id),
      );
  }

  // Sold items must show as sold: refresh their pages and the pages with product rails.
  revalidateStorefront(order.order_items.flatMap((i) => (i.product ? [i.product.slug] : [])));

  const email = order.user_id
    ? (await admin.auth.admin.getUserById(order.user_id)).data.user?.email
    : undefined;
  const address = addressSnapshotSchema.safeParse(order.address);
  const items = order.order_items.map((i) => ({
    title: i.title_snapshot,
    pricePaise: i.price_paise_snapshot,
    unavailable: i.unavailable,
  }));

  if (email && address.success) {
    await sendEmail({
      to: email,
      ...orderConfirmationEmail({
        id: order.id,
        items,
        subtotalPaise: order.subtotal_paise,
        shippingPaise: order.shipping_paise,
        discountPaise: order.discount_paise,
        totalPaise: order.total_paise,
        address: address.data,
      }),
    });
  }

  // Owner alert: fires once per order (same already_processed guard as the email above), even if
  // the buyer has no email on file or the reservation expired before the payment landed.
  const notifyInbox = orderNotificationInbox();
  if (notifyInbox && address.success) {
    await sendEmail({
      to: notifyInbox,
      ...orderNotificationEmail({
        id: order.id,
        status: result.status,
        customerEmail: email ?? null,
        items,
        subtotalPaise: order.subtotal_paise,
        shippingPaise: order.shipping_paise,
        discountPaise: order.discount_paise,
        totalPaise: order.total_paise,
        paymentMethod: order.payment_method,
        address: address.data,
        adminUrl: `${site.url}/admin/orders/${order.id}`,
      }),
    });
  }

  return { status: result.status, alreadyProcessed: false };
}

/** A payment attempt failed: free the order's holds now instead of waiting for them to expire. */
export async function releaseOrderHolds(orderId: string): Promise<void> {
  const { error } = await createAdminClient().rpc("release_order_reservations", {
    order_id: orderId,
  });
  if (error) console.error(`[orders] release holds for ${orderId}: ${error.message}`);
}
