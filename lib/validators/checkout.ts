import { z } from "zod";
import { countryCodes } from "@/lib/config/countries";
import { indianStates } from "@/lib/config/india";
import { indianMobileDigits, isIndianMobile } from "@/lib/validators/auth";
import { productIdSchema, productIdsSchema } from "@/lib/validators/cart";

// Shared by the checkout UI and the server: the browser validates before sending, the server
// validates again and trusts nothing else it receives (prices and totals come from the database).

/**
 * Matches the addresses table checks (supabase/migrations/…_schema.sql and
 * …_international_addresses.sql). Indian addresses need a state from the list, a 6-digit PIN code
 * and a 10-digit mobile number (stored without +91). Addresses abroad take a free-text region, an
 * optional postal code (Hong Kong, the UAE and Qatar have none) and a phone number with its
 * country code (stored as "+…").
 */
export const addressSchema = z
  .object({
    country: z.enum(countryCodes, { message: "Choose a country we ship to." }).default("IN"),
    name: z
      .string()
      .trim()
      .min(1, "Enter the recipient's name.")
      .max(120, "Keep it under 120 characters."),
    phone: z.string(),
    line1: z.string().trim().min(1, "Enter the house number and street.").max(200, "Too long."),
    line2: z
      .string()
      .trim()
      .max(200, "Too long.")
      .transform((v) => v || null),
    city: z.string().trim().min(1, "Enter the city.").max(80, "Too long."),
    state: z.string().trim().max(80, "Too long."),
    pincode: z.string().trim(),
  })
  .transform((a, ctx) => {
    const issue = (path: "phone" | "state" | "pincode", message: string) =>
      ctx.issues.push({ code: "custom", path: [path], message, input: a[path] });

    if (a.country === "IN") {
      const phone = indianMobileDigits(a.phone);
      if (!isIndianMobile(phone)) issue("phone", "Enter a 10-digit mobile number for the courier.");
      if (!(indianStates as readonly string[]).includes(a.state)) issue("state", "Choose a state.");
      if (!/^[1-9]\d{5}$/.test(a.pincode)) issue("pincode", "Enter a 6-digit PIN code.");
      return ctx.issues.length ? z.NEVER : { ...a, phone };
    }

    const phone = a.phone.replace(/[\s().-]/g, "").replace(/^00/, "+");
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
      issue("phone", "Enter the number with its country code, like +1 415 555 0100.");
    }
    const pincode = a.pincode.toUpperCase();
    if (pincode && !/^[A-Z0-9][A-Z0-9 -]{1,11}$/.test(pincode)) {
      issue("pincode", "Enter a valid postal code.");
    }
    return ctx.issues.length ? z.NEVER : { ...a, phone, pincode };
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
