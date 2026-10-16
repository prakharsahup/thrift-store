"use server";

import type { ActionResult } from "@/lib/cart/types";
import { getUser } from "@/lib/server/auth";
import { getCartProducts, type ProductCardData } from "@/lib/server/catalogue";
import { productIdSchema, productIdsSchema } from "@/lib/validators/cart";

// Wishlist ("watch") server actions. Guests keep their wishlist in the browser (lib/stores/
// wishlist.ts); signing in stores it in `wishlists`, which is what lets us email them if a held
// piece comes back.

/** Product ids on the signed-in user's wishlist (empty when signed out). */
export async function loadWishlistIds(): Promise<ActionResult<string[]>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: true, data: [] };
  const { data, error } = await supabase.from("wishlists").select("product_id");
  if (error) return { ok: false, message: "We couldn't load your wishlist." };
  return { ok: true, data: data.map((row) => row.product_id) };
}

/** Card data for a wishlist page (works for guests too: ids come from the browser). */
export async function getWishlistProducts(
  productIds: string[],
): Promise<ActionResult<ProductCardData[]>> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success) return { ok: false, message: "That wishlist doesn't look right." };
  return { ok: true, data: await getCartProducts(parsed.data) };
}

/**
 * On sign-in: adds the guest's saved pieces to the account (skipping anything no longer visible,
 * which RLS would refuse), then returns the merged list.
 */
export async function mergeGuestWishlist(productIds: string[]): Promise<ActionResult<string[]>> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success) return loadWishlistIds();
  const { supabase, user } = await getUser();
  if (!user)
    return { ok: false, message: "Sign in again to save your wishlist.", needsLogin: true };

  const visible = await getCartProducts(parsed.data);
  if (visible.length > 0) {
    const { error } = await supabase.from("wishlists").upsert(
      visible.map((p) => ({ user_id: user.id, product_id: p.id })),
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
    if (error) console.error("[wishlist] merge failed:", error.message);
  }
  return loadWishlistIds();
}

/** Saves or un-saves a product. Returns whether it is now saved. */
export async function setWishlisted(
  productId: string,
  saved: boolean,
): Promise<ActionResult<boolean>> {
  const parsed = productIdSchema.safeParse(productId);
  if (!parsed.success) return { ok: false, message: "That product couldn't be saved." };
  const { supabase, user } = await getUser();
  if (!user) {
    return { ok: false, message: "Sign in to save pieces to your wishlist.", needsLogin: true };
  }

  const { error } = saved
    ? await supabase
        .from("wishlists")
        .upsert(
          { user_id: user.id, product_id: parsed.data },
          { onConflict: "user_id,product_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", parsed.data);
  if (error) return { ok: false, message: "That didn't save. Try again." };

  return { ok: true, data: saved };
}
