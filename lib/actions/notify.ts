"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { site } from "@/lib/config/site";
import { dropAlertConfirmEmail, sendEmail } from "@/lib/server/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { dropAlertSchema } from "@/lib/validators/notify";

export type DropAlertState = { status: "idle" | "done" | "error"; message: string };

/** A one-way hash of the requester's IP, used only to rate-limit sign-ups (10 an hour). */
async function clientKey(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? createHash("sha256").update(`notify:${ip}`).digest("hex") : null;
}

/**
 * "Get the drop alert". request_notify (SECURITY DEFINER) does the work: rate limit, published-drop
 * check, and double opt-in, so an address is only ever emailed after its owner confirms.
 */
export async function requestDropAlert(
  _previous: DropAlertState,
  formData: FormData,
): Promise<DropAlertState> {
  // Honeypot: people never see or fill this field; bots often do. Pretend it worked.
  if (formData.get("website")) return { status: "done", message: "Check your inbox to confirm." };

  const parsed = dropAlertSchema.safeParse({
    email: formData.get("email") ?? "",
    dropId: formData.get("dropId") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check your email." };
  }
  const { email, dropId } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("request_notify", {
      email,
      drop_id: dropId,
      client_key: (await clientKey()) ?? undefined,
    });
    if (error) throw error;
    const result = data as
      | { ok: false; reason: "rate_limited" | "not_found" }
      | { ok: true; status: "subscribed" }
      | { ok: true; status: "pending"; send_confirmation: boolean; confirm_token: string };

    if (!result.ok) {
      return {
        status: "error",
        message:
          result.reason === "rate_limited"
            ? "Too many sign-ups from here. Try again in an hour."
            : "That drop isn't available any more.",
      };
    }
    if (result.status === "subscribed") {
      return { status: "done", message: "You're on the list. We'll email you when it drops." };
    }
    if (result.send_confirmation) {
      const { data: drop } = await supabase.from("drops").select("name").eq("id", dropId).single();
      const sent = await sendEmail({
        to: email,
        ...dropAlertConfirmEmail({
          dropName: drop?.name ?? "the next drop",
          confirmUrl: `${site.url}/notify/confirm?token=${result.confirm_token}`,
        }),
      });
      if (!sent) {
        return {
          status: "error",
          message: "We couldn't send the confirmation email just now. Try again in a little while.",
        };
      }
    }
    return { status: "done", message: "Almost there: check your inbox and confirm the alert." };
  } catch (error) {
    console.error("[notify] request_notify failed:", error);
    return { status: "error", message: "Something went wrong on our side. Try again shortly." };
  }
}
