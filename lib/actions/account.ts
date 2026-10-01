"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/server/auth";
import { profileSchema } from "@/lib/validators/auth";

export type ProfileFormState = {
  status: "idle" | "saved" | "error";
  message: string;
  fieldErrors?: { fullName?: string; phone?: string };
};

/** Updates the signed-in user's name and phone (RLS + column privileges block anything else). */
export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { fullName: errors.fullName?.[0], phone: errors.phone?.[0] },
    };
  }

  const { supabase, user } = await getUser();
  if (!user) return { status: "error", message: "Your session ended. Sign in again." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName || null, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (error) return { status: "error", message: "We couldn't save that. Try again." };

  revalidatePath("/account");
  return { status: "saved", message: "Saved." };
}
