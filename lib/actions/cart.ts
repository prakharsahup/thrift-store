"use server";

import type { ActionResult, CartLine } from "@/lib/cart/types";
import { getUser } from "@/lib/server/auth";
import { getCartProducts, type ProductCardData } from "@/lib/server/catalogue";
import { productIdSchema, productIdsSchema } from "@/lib/validators/cart";

// Cart server actions. Guest carts live in the browser and only use getCartLines to refresh their
// display data; signed-in carts are stored in `cart_items` (RLS: own rows only).

function toLine(p: ProductCardData): CartLine {
  return {
    productId: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    taggedSize: p.taggedSize,
    pricePaise: p.pricePaise,
    imageUrl: p.images[0]?.url ?? null,
    status: p.status,
  };
}

/** Same limit as the cart_items_limit trigger (supabase/migrations/…_cart_items.sql). */
const CART_LIMIT = 30;

const SIGN_IN_AGAIN = "Your session ended. Sign in again to update your cart.";

/** Fresh prices and availability for a guest cart. Unknown or hidden products are dropped. */
export async function getCartLines(productIds: string[]): Promise<ActionResult<CartLine[]>> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success) return { ok: false, message: "That cart doesn't look right. Try again." };
  const products = await getCartProducts(parsed.data);
  return { ok: true, data: products.map(toLine) };
}

/** The signed-in user's cart, oldest first. */
export async function loadAccountCart(): Promise<ActionResult<CartLine[]>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN, needsLogin: true };

  const { data, error } = await supabase.from("cart_items").select("product_id").order("added_at");
  if (error) return { ok: false, message: "We couldn't load your cart. Try again." };
  const products = await getCartProducts(data.map((row) => row.product_id));
  return { ok: true, data: products.map(toLine) };
}

export async function addToAccountCart(productId: string): Promise<ActionResult<null>> {
  const parsed = productIdSchema.safeParse(productId);
  if (!parsed.success) return { ok: false, message: "That product couldn't be added." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN, needsLogin: true };

  const { error } = await supabase
    .from("cart_items")
    .upsert(
      { user_id: user.id, product_id: parsed.data },
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
  if (error) {
    return {
      ok: false,
      message: error.code === "23514" ? error.message : "That piece couldn't be added. Try again.",
    };
  }
  return { ok: true, data: null };
}

export async function removeFromAccountCart(productId: string): Promise<ActionResult<null>> {
  const parsed = productIdSchema.safeParse(productId);
  if (!parsed.success) return { ok: false, message: "That product couldn't be removed." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN, needsLogin: true };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", parsed.data);
  if (error) return { ok: false, message: "That piece couldn't be removed. Try again." };
  return { ok: true, data: null };
}

/**
 * On sign-in: moves the guest cart into the account (skipping sold, hidden and duplicate items),
 * then returns the merged account cart.
 */
export async function mergeGuestCart(productIds: string[]): Promise<ActionResult<CartLine[]>> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success) return loadAccountCart();
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN, needsLogin: true };

  const [products, existing] = await Promise.all([
    getCartProducts(parsed.data),
    supabase.from("cart_items").select("product_id"),
  ]);
  if (existing.error) return loadAccountCart();

  // One insert for the lot. Only what fits is sent: one row over the cart limit would make the
  // limit trigger reject the whole batch.
  const inCart = new Set(existing.data.map((row) => row.product_id));
  const rows = products
    .filter((p) => p.status !== "sold" && !inCart.has(p.id))
    .slice(0, Math.max(0, CART_LIMIT - inCart.size))
    .map((p) => ({ user_id: user.id, product_id: p.id }));
  if (rows.length > 0) {
    await supabase
      .from("cart_items")
      .upsert(rows, { onConflict: "user_id,product_id", ignoreDuplicates: true });
  }
  return loadAccountCart();
}
