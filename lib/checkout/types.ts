// Checkout types shared by the server (routes, loaders) and the checkout UI.

/** A piece held for the shopper's checkout. */
export type HeldItem = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  taggedSize: string | null;
  pricePaise: number;
  imageUrl: string | null;
  imageAlt: string;
};

/** POST /api/checkout, success: everything Razorpay Checkout needs to open. */
export type CheckoutStarted = {
  ok: true;
  orderId: string;
  razorpayOrderId: string;
  keyId: string;
  /** What Razorpay charges, in the smallest unit of `currency` (paise or cents). */
  amount: number;
  currency: "INR" | "USD";
  reservedUntil: string;
  prefill: { name: string; email: string; contact: string };
};

/** Any checkout API failure. `unavailableProductIds`: pieces someone else got first. */
export type CheckoutFailed = {
  ok: false;
  message: string;
  unavailableProductIds?: string[];
  /** The coupon was the problem (shown next to the coupon field). */
  field?: "coupon";
  needsLogin?: boolean;
};

/** POST /api/razorpay/verify */
export type VerifyResult = { ok: true; orderId: string } | { ok: false; message: string };
