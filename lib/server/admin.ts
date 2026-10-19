import "server-only";
import { z } from "zod";
import type { requireAdmin } from "@/lib/server/auth";

// Reads for the admin pages. They take the admin's own client (from requireAdmin), so RLS still
// applies (is_admin() grants full access).

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

export const ADMIN_PAGE_SIZE = 50;

export type ProductStatus = "draft" | "available" | "reserved" | "sold";

export async function getAdminProducts(
  supabase: AdminClient,
  filters: { q: string; status: ProductStatus | null; page: number },
) {
  let query = supabase
    .from("products")
    .select(
      "id, slug, title, brand, price_paise, status, updated_at, category:categories(name), product_images(url, alt, sort_order)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .order("sort_order", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" });
  if (filters.status) query = query.eq("status", filters.status);
  const q = filters.q.replace(/[%_,()]/g, " ").trim();
  if (q) query = query.or(`title.ilike.%${q}%,brand.ilike.%${q}%,slug.ilike.%${q}%`);

  const from = (filters.page - 1) * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error(`admin products: ${error.message}`);
  return { products: data, total: count ?? 0 };
}

export async function getAdminProduct(supabase: AdminClient, id: string) {
  const [{ data: product, error }, { data: holds }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, slug, title, description, brand, category_id, drop_id, gender, tagged_size, condition, measurements, flaws, country_of_origin, style_tags, price_paise, original_price_paise, status, sold_at, created_at, published_at, product_images(id, url, alt, sort_order), cost:product_costs(cost_paise, source, acquired_on)",
      )
      .eq("id", id)
      .order("sort_order", { referencedTable: "product_images" })
      .maybeSingle(),
    supabase.rpc("admin_product_holds", { product_ids: [id] }),
  ]);
  if (error) throw new Error(`admin product: ${error.message}`);
  return product ? { ...product, hold: holds?.[0] ?? null } : null;
}

/** "Men › Jackets" style labels for category pickers, roots first. */
export async function getCategoryOptions(supabase: AdminClient) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, gender, parent_id, sort_order, image_url")
    .order("sort_order");
  if (error) throw new Error(`categories: ${error.message}`);
  const byId = new Map(data.map((c) => [c.id, c]));
  return data
    .map((c) => {
      const parent = c.parent_id ? byId.get(c.parent_id) : null;
      return { ...c, label: parent ? `${parent.name} › ${c.name}` : c.name };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getDropOptions(supabase: AdminClient) {
  const { data, error } = await supabase
    .from("drops")
    .select("id, name, go_live_at, is_published")
    .order("go_live_at", { ascending: false });
  if (error) throw new Error(`drops: ${error.message}`);
  return data;
}

const missingCostRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  brand: z.string().nullable(),
  status: z.enum(["draft", "available", "reserved", "sold"]),
  price_paise: z.number(),
  sold_at: z.string().nullable(),
  source: z.string().nullable(),
  image_url: z.string().nullable(),
  image_alt: z.string().nullable(),
});

/** Pieces with no cost entered yet (sold first), and how many of all pieces have one. */
export async function getProductsMissingCost(supabase: AdminClient, page: number) {
  const count = { count: "exact", head: true } as const;
  const [missing, all, costed] = await Promise.all([
    supabase.rpc("admin_products_missing_cost", {
      p_limit: ADMIN_PAGE_SIZE,
      p_offset: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    supabase.from("products").select("id", count),
    supabase.from("product_costs").select("product_id", count).not("cost_paise", "is", null),
  ]);
  const failed = [missing, all, costed].find((r) => r.error);
  if (failed?.error) throw new Error(`products missing cost: ${failed.error.message}`);
  const total = all.count ?? 0;
  const withCost = costed.count ?? 0;
  // Counted rather than read off the rows, so a page past the end still reports the real number.
  return { products: z.array(missingCostRowSchema).parse(missing.data), total, withCost };
}
