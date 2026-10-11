"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failedForm, invalidForm, type FormState } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/server/auth";
import { revalidateWholeStore } from "@/lib/server/revalidate";
import { slugify } from "@/lib/utils/slug";
import {
  bannerFormSchema,
  categoryFormSchema,
  couponFormSchema,
  dropFormSchema,
} from "@/lib/validators/admin";

// Drops, categories, banners and coupons. Same rules as the product actions: admin re-checked on
// every call, every query through RLS. Creating redirects to the new row's editor.

type DeleteResult = { ok: true } | { ok: false; message: string };

const idSchema = z.uuid();

function duplicateSlug(): FormState {
  return {
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors: { slug: "Another one already uses this URL." },
  };
}

// ---------------------------------------------------------------------------
// Drops
// ---------------------------------------------------------------------------

export async function saveDrop(
  id: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = dropFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);
  const row = { ...parsed.data, slug: parsed.data.slug ?? slugify(parsed.data.name) };

  const result = id
    ? await supabase.from("drops").update(row).eq("id", id).select("id").single()
    : await supabase.from("drops").insert(row).select("id").single();
  if (result.error) {
    return result.error.code === "23505"
      ? duplicateSlug()
      : failedForm(`Couldn't save: ${result.error.message}`);
  }
  revalidateWholeStore();
  if (!id) redirect(`/admin/drops?edit=${result.data.id}&created=1`);
  return { status: "saved", message: "Saved." };
}

export async function deleteDrop(id: string): Promise<DeleteResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Drop not found." };
  // Deleting a drop would put its pieces on sale at once (drop_id is set to null), so don't.
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("drop_id", id);
  if (count) {
    return {
      ok: false,
      message: `This drop still has ${count} piece${count === 1 ? "" : "s"}. Move them out first.`,
    };
  }
  const { error } = await supabase.from("drops").delete().eq("id", id);
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` };
  revalidateWholeStore();
  redirect("/admin/drops?deleted=1");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function saveCategory(
  id: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = categoryFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);
  if (id && parsed.data.parent_id === id) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { parent_id: "A category can't be its own parent." },
    };
  }
  const row = { ...parsed.data, slug: parsed.data.slug ?? slugify(parsed.data.name) };

  const result = id
    ? await supabase.from("categories").update(row).eq("id", id).select("id").single()
    : await supabase.from("categories").insert(row).select("id").single();
  if (result.error) {
    return result.error.code === "23505"
      ? duplicateSlug()
      : failedForm(`Couldn't save: ${result.error.message}`);
  }
  revalidateWholeStore();
  if (!id) redirect(`/admin/categories?edit=${result.data.id}&created=1`);
  return { status: "saved", message: "Saved." };
}

export async function deleteCategory(id: string): Promise<DeleteResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Category not found." };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "This category still has products or sub-categories. Move them first."
          : `Couldn't delete: ${error.message}`,
    };
  }
  revalidateWholeStore();
  redirect("/admin/categories?deleted=1");
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export async function saveBanner(
  id: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = bannerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);

  const result = id
    ? await supabase.from("banners").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("banners").insert(parsed.data).select("id").single();
  if (result.error) return failedForm(`Couldn't save: ${result.error.message}`);
  revalidatePath("/");
  if (!id) redirect(`/admin/banners?edit=${result.data.id}&created=1`);
  return { status: "saved", message: "Saved." };
}

export async function deleteBanner(id: string): Promise<DeleteResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Banner not found." };
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` };
  revalidatePath("/");
  redirect("/admin/banners?deleted=1");
}

// ---------------------------------------------------------------------------
// Coupons (the code is the key, so it can't be changed after creation)
// ---------------------------------------------------------------------------

export async function saveCoupon(
  code: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = couponFormSchema.safeParse({
    ...Object.fromEntries(formData),
    ...(code ? { code } : {}),
  });
  if (!parsed.success) return invalidForm(parsed.error);

  if (code) {
    const { type, value, min_order_paise, max_uses, expires_at, active } = parsed.data;
    const changes = { type, value, min_order_paise, max_uses, expires_at, active };
    const { error } = await supabase.from("coupons").update(changes).eq("code", code);
    if (error) return failedForm(`Couldn't save: ${error.message}`);
    revalidatePath("/admin/coupons");
    return { status: "saved", message: "Saved." };
  }

  const { error } = await supabase.from("coupons").insert(parsed.data);
  if (error) {
    return error.code === "23505"
      ? {
          status: "error",
          message: "Check the highlighted fields.",
          fieldErrors: { code: "That code already exists." },
        }
      : failedForm(`Couldn't save: ${error.message}`);
  }
  redirect(`/admin/coupons?edit=${parsed.data.code}&created=1`);
}

export async function deleteCoupon(code: string): Promise<DeleteResult> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("coupons")
    .select("used_count")
    .eq("code", code)
    .maybeSingle();
  if (!data) return { ok: false, message: "Coupon not found." };
  if (data.used_count > 0) {
    return {
      ok: false,
      message:
        "This coupon has been used, so it's kept for the records. Untick Active to switch it off.",
    };
  }
  const { error } = await supabase.from("coupons").delete().eq("code", code);
  if (error) return { ok: false, message: `Couldn't delete: ${error.message}` };
  redirect("/admin/coupons?deleted=1");
}
