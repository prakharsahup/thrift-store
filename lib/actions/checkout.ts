"use server";

import type { ActionResult } from "@/lib/cart/types";
import { getUser } from "@/lib/server/auth";
import { quoteCoupon } from "@/lib/server/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { productIdsSchema } from "@/lib/validators/cart";
import { couponCodeSchema } from "@/lib/validators/checkout";

const SIGN_IN = "Sign in to check out.";

/**
 * "Checkout" in the cart: holds the pieces for 15 minutes (CLAUDE.md §4) before the checkout page
 * opens. Returns the ids that couldn't be held (sold or held by someone else).
 */
export async function holdCart(
  productIds: string[],
): Promise<ActionResult<{ unavailableProductIds: string[] }>> {
  const parsed = productIdsSchema.min(1).safeParse(productIds);
  if (!parsed.success) return { ok: false, message: "Your cart is empty." };
  const { user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN, needsLogin: true };

  const { data, error } = await createAdminClient().rpc("reserve_products", {
    product_ids: parsed.data,
    user_id: user.id,
  });
  if (error) return { ok: false, message: "We couldn't start checkout. Try again." };
  return { ok: true, data: { unavailableProductIds: data } };
}

/**
 * Coupon preview on the checkout page: what the code would take off these pieces, without using
 * it up. The code is only claimed when payment starts (/api/checkout).
 */
export async function previewCoupon(
  code: string,
  productIds: string[],
): Promise<ActionResult<{ code: string; discountPaise: number }>> {
  const parsedCode = couponCodeSchema.safeParse(code);
  if (!parsedCode.success) {
    return { ok: false, message: parsedCode.error.issues[0]?.message ?? "Check the code." };
  }
  const parsedIds = productIdsSchema.min(1).safeParse(productIds);
  if (!parsedIds.success) return { ok: false, message: "Your cart is empty." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN, needsLogin: true };

  // Prices from the database, as checkout will use them.
  const { data: products, error } = await supabase
    .from("storefront_products")
    .select("price_paise")
    .in("id", parsedIds.data);
  if (error) return { ok: false, message: "We couldn't check that code. Try again." };
  const subtotal = products.reduce((sum, p) => sum + p.price_paise, 0);

  const quote = await quoteCoupon(parsedCode.data, user.id, subtotal);
  return quote.ok
    ? { ok: true, data: { code: parsedCode.data, discountPaise: quote.discountPaise } }
    : { ok: false, message: quote.message };
}
