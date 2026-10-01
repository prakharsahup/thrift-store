"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/cart/types";
import { getUser } from "@/lib/server/auth";
import { productIdSchema } from "@/lib/validators/cart";

// Wishlist ("watch") server actions. Saving needs an account: we email you if a saved piece comes
// back (drops phase).

/** Product ids on the signed-in user's wishlist (empty when signed out). */
export async function loadWishlistIds(): Promise<ActionResult<string[]>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: true, data: [] };
  const { data, error } = await supabase.from("wishlists").select("product_id");
  if (error) return { ok: false, message: "We couldn't load your wishlist." };
  return { ok: true, data: data.map((row) => row.product_id) };
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

  revalidatePath("/account/wishlist");
  return { ok: true, data: saved };
}

/** Form action for the "Remove" buttons on /account/wishlist (works without JavaScript). */
export async function removeFromWishlistForm(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  if (typeof productId === "string") await setWishlisted(productId, false);
}
