import "server-only";
import type { User } from "@supabase/supabase-js";
import type { Address } from "@/lib/actions/addresses";
import type { HeldItem } from "@/lib/checkout/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validators/checkout";

type UserClient = Awaited<ReturnType<typeof createClient>>;

/** The user's saved addresses, default first. */
export async function getAddresses(supabase: UserClient): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("id, name, phone, line1, line2, city, state, pincode, is_default")
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) console.error(`[checkout] addresses: ${error.message}`);
  return (data ?? []).flatMap((row) => {
    // Rows written by older code or by hand may not match today's form rules; skip them.
    const parsed = addressSchema.safeParse({ ...row, line2: row.line2 ?? "" });
    return parsed.success ? [{ ...parsed.data, id: row.id, isDefault: row.is_default }] : [];
  });
}

/**
 * The pieces currently held for this user (their live checkout), and when the hold ends.
 * Reads reservation columns, which only the service role can see.
 */
export async function getHeldItems(
  user: User,
): Promise<{ items: HeldItem[]; reservedUntil: string | null }> {
  const { data, error } = await createAdminClient()
    .from("products")
    .select(
      "id, slug, title, brand, tagged_size, price_paise, reserved_until, product_images(url, alt, sort_order)",
    )
    .eq("status", "reserved")
    .eq("reserved_by", user.id)
    .gt("reserved_until", new Date().toISOString())
    .order("reserved_until")
    .order("sort_order", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" });
  if (error) console.error(`[checkout] held items: ${error.message}`);
  const rows = data ?? [];
  return {
    items: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      taggedSize: p.tagged_size,
      pricePaise: p.price_paise,
      imageUrl: p.product_images[0]?.url ?? null,
      imageAlt: p.product_images[0]?.alt ?? p.title,
    })),
    // The earliest expiry is when the checkout as a whole runs out of time.
    reservedUntil: rows[0]?.reserved_until ?? null,
  };
}
