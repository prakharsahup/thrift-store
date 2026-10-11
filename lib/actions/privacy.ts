"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteAccountState = { status: "idle" | "deleted" | "error"; message: string };

/** Orders still on their way to the shopper. The account can't be deleted until they arrive. */
const ACTIVE_ORDER_STATUSES = ["paid", "packed", "shipped"] as const;

/**
 * Right to erasure (DPDP Act 2023 s. 12). Deletes the sign-in, profile, addresses, cart, wishlist
 * and email subscriptions. Orders are kept (tax law requires it) but are no longer linked to an
 * account; support tickets are kept for their retention period, likewise unlinked.
 */
export async function deleteAccount(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toUpperCase() !== "DELETE"
  ) {
    return { status: "error", message: "Type DELETE in the box to confirm." };
  }

  const { supabase, user } = await getUser();
  if (!user) return { status: "error", message: "Your session ended. Sign in again." };

  const { count, error: ordersError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", [...ACTIVE_ORDER_STATUSES]);
  if (ordersError) {
    return { status: "error", message: "We couldn't check your orders. Try again." };
  }
  if (count) {
    return {
      status: "error",
      message:
        "You have an order on its way. You can delete your account once it's delivered — or contact us and we'll do it for you then.",
    };
  }

  const admin = createAdminClient();
  // Abandoned checkouts: cancelling releases their holds (release_cancelled_order trigger).
  await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "pending");
  if (user.email) {
    await admin.from("notify_requests").delete().eq("email", user.email.toLowerCase());
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[privacy] deleteUser failed:", error);
    return {
      status: "error",
      message: "We couldn't delete your account just now. Try again, or contact us.",
    };
  }

  // The session cookies are cleared by the browser (DeleteAccountForm), not here: changing
  // cookies in a server action re-renders this signed-in page, which would bounce to /login
  // before the confirmation page loads.
  return { status: "deleted", message: "Your account and personal data have been deleted." };
}

export type UnsubscribeState = { status: "idle" | "done" | "error"; message: string };

/** Withdraws consent to every email alert (drops and watched pieces) for the account's email. */
export async function unsubscribeAll(): Promise<UnsubscribeState> {
  const { user } = await getUser();
  if (!user?.email) return { status: "error", message: "Sign in again to change this." };
  const { error } = await createAdminClient()
    .from("notify_requests")
    .delete()
    .eq("email", user.email.toLowerCase());
  if (error) return { status: "error", message: "That didn't work. Try again." };
  revalidatePath("/account/privacy");
  return { status: "done", message: "Done — you won't get any more alerts." };
}
