import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay over its REST API (no SDK needed for the three things we do). Server-only: the key
// secret and webhook secret never leave this file. Docs: razorpay.com/docs/api/orders and
// razorpay.com/docs/payments/payment-gateway/web-integration/standard (signature checks).

type RazorpayConfig = { keyId: string; keySecret: string };

/** The API keys, or null while payments aren't set up (checkout then says so politely). */
export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

/** Constant-time comparison of a hex HMAC-SHA256 against what we compute. */
function hmacMatches(secret: string, payload: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest();
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Creates the Razorpay order the browser pays against. `amountPaise` must come from our own
 * order row, never from the client. Returns Razorpay's order id ("order_…").
 */
export async function createRazorpayOrder(
  config: RazorpayConfig,
  order: { id: string; amountPaise: number },
): Promise<string> {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.amountPaise,
      currency: "INR",
      receipt: order.id,
      notes: { order_id: order.id },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Razorpay order creation failed: ${response.status} ${await response.text()}`);
  }
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("id" in body) || typeof body.id !== "string") {
    throw new Error("Razorpay order creation returned no id");
  }
  return body.id;
}

/** Checkout success callback: signature = HMAC_SHA256(order_id + "|" + payment_id, key secret). */
export function verifyPaymentSignature(
  config: RazorpayConfig,
  payment: { razorpayOrderId: string; razorpayPaymentId: string; signature: string },
): boolean {
  return hmacMatches(
    config.keySecret,
    `${payment.razorpayOrderId}|${payment.razorpayPaymentId}`,
    payment.signature,
  );
}

/**
 * Webhook: X-Razorpay-Signature = HMAC_SHA256(raw request body, webhook secret). Returns false
 * when the webhook secret isn't configured, so unsigned calls are always rejected.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return hmacMatches(secret, rawBody, signature);
}
