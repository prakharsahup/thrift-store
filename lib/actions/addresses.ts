"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/server/auth";
import { addressSchema, type AddressInput } from "@/lib/validators/checkout";

// Saved delivery addresses. RLS limits every query to the signed-in user's own rows.

export type Address = AddressInput & { id: string; isDefault: boolean };

export type AddressResult =
  | { ok: true; address: Address }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof AddressInput, string>>;
      needsLogin?: boolean;
    };

const SIGN_IN_AGAIN = "Your session ended. Sign in again.";

/** Adds an address. The first one (or any with makeDefault) becomes the default. */
export async function createAddress(input: unknown, makeDefault = false): Promise<AddressResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: Object.fromEntries(
        Object.entries(errors).map(([key, messages]) => [key, messages?.[0]]),
      ),
    };
  }
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN, needsLogin: true };

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("is_default", true);
  const isDefault = makeDefault || !count;
  if (isDefault && count) {
    await supabase.from("addresses").update({ is_default: false }).eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...parsed.data, user_id: user.id, is_default: isDefault })
    .select("id")
    .single();
  if (error) return { ok: false, message: "We couldn't save that address. Try again." };

  revalidatePath("/account/addresses");
  return { ok: true, address: { ...parsed.data, id: data.id, isDefault } };
}

export async function deleteAddress(id: string): Promise<{ ok: boolean; message?: string }> {
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Address not found." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN };
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { ok: false, message: "We couldn't delete that address. Try again." };
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function makeDefaultAddress(id: string): Promise<{ ok: boolean; message?: string }> {
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Address not found." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, message: SIGN_IN_AGAIN };
  // One default per user (unique index): clear the old one first.
  await supabase.from("addresses").update({ is_default: false }).eq("is_default", true);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) return { ok: false, message: "We couldn't update that address. Try again." };
  revalidatePath("/account/addresses");
  return { ok: true };
}
