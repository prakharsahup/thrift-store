"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failedForm, invalidForm, type FormState } from "@/lib/admin/form";
import { CATALOGUE_BUCKET, cataloguePathFromUrl } from "@/lib/admin/images";
import { requireAdmin } from "@/lib/server/auth";
import { revalidateStorefront } from "@/lib/server/revalidate";
import { slugify } from "@/lib/utils/slug";
import {
  imageAltSchema,
  measurementsFrom,
  productCostRow,
  productCostSchema,
  productFormSchema,
  type ProductCost,
} from "@/lib/validators/admin";

// Product admin (CLAUDE.md §8). Every action re-checks the admin role, and every query runs as
// the admin through RLS.

type ActionResult = { ok: true } | { ok: false; message: string };

const idSchema = z.uuid();

/** "faded-denim-jacket" → "faded-denim-jacket-7f3a": thrift titles repeat, URLs mustn't. */
function uniqueSlug(base: string): string {
  return `${slugify(base).slice(0, 70) || "piece"}-${randomBytes(2).toString("hex")}`;
}

/** Writes a piece's acquisition cost, or removes it when the fields were cleared. */
async function saveCost(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
  cost: ProductCost,
): Promise<string | null> {
  const row = productCostRow(productId, cost);
  const { error } = row
    ? await supabase.from("product_costs").upsert(row)
    : await supabase.from("product_costs").delete().eq("product_id", productId);
  return error?.message ?? null;
}

/**
 * Creates (productId null) or updates a product from the product form. On create, redirects to
 * the new product's edit page so photos can be added.
 */
export async function saveProduct(
  productId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = productFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);
  const form = parsed.data;

  let current: { slug: string; status: string } | null = null;
  if (productId) {
    const { data } = await supabase
      .from("products")
      .select("slug, status")
      .eq("id", productId)
      .maybeSingle();
    if (!data) return failedForm("This product no longer exists.");
    current = data;
  }

  const row = {
    title: form.title,
    slug: form.slug ?? current?.slug ?? uniqueSlug(form.title),
    description: form.description,
    brand: form.brand,
    category_id: form.category_id,
    drop_id: form.drop_id,
    gender: form.gender,
    tagged_size: form.tagged_size,
    condition: form.condition,
    flaws: form.flaws,
    country_of_origin: form.country_of_origin,
    style_tags: form.style_tags,
    measurements: measurementsFrom(form),
    price_paise: form.price,
    original_price_paise: form.original_price,
  };

  // Status: "reserved" in the form means a shopper is mid-checkout; leave it alone. Otherwise keep
  // the status columns consistent (products_sold_at_consistent, products_reservation_consistent).
  const statusChange =
    form.status === "reserved" || form.status === current?.status
      ? {}
      : {
          status: form.status,
          sold_at: form.status === "sold" ? new Date().toISOString() : null,
          reserved_until: null,
          reserved_by: null,
          reserved_order_id: null,
        };

  const result = productId
    ? await supabase
        .from("products")
        .update({ ...row, ...statusChange })
        .eq("id", productId)
        .select("id")
        .single()
    : await supabase
        .from("products")
        .insert({
          ...row,
          status: form.status === "reserved" ? "draft" : form.status,
          ...statusChange,
        })
        .select("id")
        .single();

  if (result.error) {
    if (result.error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: "Another product already uses this URL." },
      };
    }
    return failedForm(`Couldn't save: ${result.error.message}`);
  }

  const costError = await saveCost(supabase, result.data.id, form);
  if (costError) {
    if (!productId) redirect(`/admin/products/${result.data.id}?created=1&cost_failed=1`);
    return failedForm(`Saved the product, but not its cost: ${costError}`);
  }

  revalidateStorefront([row.slug, ...(current && current.slug !== row.slug ? [current.slug] : [])]);
  if (!productId) redirect(`/admin/products/${result.data.id}?created=1`);
  return { status: "saved", message: "Saved." };
}

/** Copies a product's details (not its photos — it's a different physical piece) into a new draft. */
export async function duplicateProduct(productId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(productId).success) redirect("/admin/products");
  const { data: source } = await supabase
    .from("products")
    .select(
      "title, description, brand, category_id, drop_id, gender, tagged_size, condition, measurements, flaws, country_of_origin, style_tags, price_paise, original_price_paise",
    )
    .eq("id", productId)
    .single();
  if (!source) redirect("/admin/products");

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...source,
      title: `${source.title} (copy)`,
      slug: uniqueSlug(source.title),
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Duplicate failed: ${error.message}`);

  // Similar pieces usually come from the same lot, so the cost and source carry over too.
  const { data: cost } = await supabase
    .from("product_costs")
    .select("cost_paise, source, acquired_on")
    .eq("product_id", productId)
    .maybeSingle();
  if (cost) await supabase.from("product_costs").insert({ ...cost, product_id: data.id });
  redirect(`/admin/products/${data.id}?duplicated=1`);
}

/** Deletes a product that has never been ordered (ordered ones must stay for order history). */
export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(productId).success) return { ok: false, message: "Product not found." };

  const { count } = await supabase
    .from("order_items")
    .select("product_id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (count) {
    return {
      ok: false,
      message:
        "This piece is part of an order, so it can't be deleted. Set it to Draft to hide it instead.",
    };
  }

  const { data: product } = await supabase
    .from("products")
    .select("slug, product_images(url)")
    .eq("id", productId)
    .single();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` };

  const paths = (product?.product_images ?? []).flatMap((i) => cataloguePathFromUrl(i.url) ?? []);
  if (paths.length) await supabase.storage.from(CATALOGUE_BUCKET).remove(paths);
  if (product) revalidateStorefront([product.slug]);
  redirect("/admin/products?deleted=1");
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

async function productSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
) {
  const { data } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  return data?.slug ?? null;
}

/** Adds uploaded photos (already in storage) to the end of a product's gallery. */
export async function addProductImages(
  productId: string,
  images: { url: string; alt: string }[],
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      productId: idSchema,
      images: z
        .array(z.object({ url: z.url(), alt: z.string().trim().max(200) }))
        .min(1)
        .max(20),
    })
    .safeParse({ productId, images });
  if (!parsed.success) return { ok: false, message: "Those photos couldn't be added." };

  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("product_images").insert(
    parsed.data.images.map((image, i) => ({
      product_id: productId,
      url: image.url,
      alt: image.alt,
      sort_order: start + i,
    })),
  );
  if (error) return { ok: false, message: `Couldn't add the photos: ${error.message}` };
  const slug = await productSlug(supabase, productId);
  if (slug) revalidateStorefront([slug]);
  return { ok: true };
}

/** Saves a new photo order (the first photo is the card image; the second shows on hover). */
export async function reorderProductImages(
  productId: string,
  imageIds: string[],
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (
    !idSchema.safeParse(productId).success ||
    !z.array(idSchema).max(50).safeParse(imageIds).success
  ) {
    return { ok: false, message: "Couldn't save the new order." };
  }
  const results = await Promise.all(
    imageIds.map((id, index) =>
      supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("product_id", productId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error)
    return { ok: false, message: `Couldn't save the new order: ${failed.error.message}` };
  const slug = await productSlug(supabase, productId);
  if (slug) revalidateStorefront([slug]);
  return { ok: true };
}

export async function updateImageAlt(imageId: string, alt: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsedAlt = imageAltSchema.safeParse(alt);
  if (!idSchema.safeParse(imageId).success) return { ok: false, message: "Photo not found." };
  if (!parsedAlt.success)
    return { ok: false, message: parsedAlt.error.issues[0]?.message ?? "Check the description." };
  const { data, error } = await supabase
    .from("product_images")
    .update({ alt: parsedAlt.data })
    .eq("id", imageId)
    .select("product:products(slug)")
    .single();
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  if (data.product) revalidateStorefront([data.product.slug]);
  return { ok: true };
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(imageId).success) return { ok: false, message: "Photo not found." };
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .select("url, product:products(slug)")
    .single();
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` };
  const path = cataloguePathFromUrl(data.url);
  if (path) await supabase.storage.from(CATALOGUE_BUCKET).remove([path]);
  if (data.product) revalidateStorefront([data.product.slug]);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Costs
// ---------------------------------------------------------------------------

/**
 * Saves the bulk cost-entry form (/admin/products/costs): fields named cost_<id> and
 * cost_source_<id>, one pair per listed piece. Rows left blank are skipped, not cleared, so
 * saving a half-filled page never wipes anything.
 */
export async function saveProductCosts(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const ids = formData
    .getAll("product_id")
    .filter((id): id is string => typeof id === "string" && idSchema.safeParse(id).success)
    .slice(0, 100);

  const fieldErrors: Record<string, string> = {};
  const rows: NonNullable<ReturnType<typeof productCostRow>>[] = [];
  for (const id of ids) {
    const parsed = productCostSchema.safeParse({
      cost: formData.get(`cost_${id}`) ?? "",
      cost_source: formData.get(`cost_source_${id}`) ?? "",
      acquired_on: "",
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fieldErrors[`${String(issue.path[0])}_${id}`] ??= issue.message;
      }
      continue;
    }
    const row = productCostRow(id, parsed.data);
    if (row) rows.push(row);
  }
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }
  if (!rows.length) return failedForm("Enter at least one cost.");

  // The page prefills any source already saved, so overwriting the whole row loses nothing.
  const { error } = await supabase.from("product_costs").upsert(rows);
  if (error) return failedForm(`Couldn't save: ${error.message}`);
  revalidatePath("/admin/products/costs");
  return {
    status: "saved",
    message: `Saved ${rows.length} ${rows.length === 1 ? "cost" : "costs"}.`,
  };
}
