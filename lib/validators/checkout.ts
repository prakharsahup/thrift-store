import { z } from "zod";
import { indianStates } from "@/lib/config/india";
import { indianMobileDigits, isIndianMobile } from "@/lib/validators/auth";
import { productIdSchema, productIdsSchema } from "@/lib/validators/cart";

// Shared by the checkout UI and the server: the browser validates before sending, the server
// validates again and trusts nothing else it receives (prices and totals come from the database).

/** Matches the addresses table checks (supabase/migrations/…_schema.sql). */
export const addressSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the recipient's name.")
    .max(120, "Keep it under 120 characters."),
  phone: z.string().transform(indianMobileDigits).refine(isIndianMobile, {
    message: "Enter a 10-digit mobile number for the courier.",
  }),
  line1: z.string().trim().min(1, "Enter the house number and street.").max(200, "Too long."),
  line2: z
    .string()
    .trim()
    .max(200, "Too long.")
    .transform((v) => v || null),
  city: z.string().trim().min(1, "Enter the city.").max(80, "Too long."),
  state: z.enum(indianStates, { message: "Choose a state." }),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code."),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/, "Coupon codes are 3–20 letters and numbers.");

/** POST /api/checkout */
export const checkoutRequestSchema = z.object({
  productIds: productIdsSchema.min(1),
  addressId: z.uuid(),
  couponCode: couponCodeSchema.optional(),
});

/** POST /api/razorpay/verify: what Razorpay Checkout hands the browser after a payment. */
export const verifyRequestSchema = z.object({
  orderId: productIdSchema,
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});
