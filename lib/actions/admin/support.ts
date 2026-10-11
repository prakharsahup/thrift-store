"use server";

import { revalidatePath } from "next/cache";
import { failedForm, invalidForm, type FormState } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/server/auth";
import { sendEmail, supportResolvedEmail } from "@/lib/server/email";
import { supportUpdateSchema } from "@/lib/validators/support";

/**
 * Moves a support ticket along (open → in progress → resolved) and records what was done. The
 * customer is emailed the resolution note when a ticket is resolved.
 */
export async function updateSupportRequest(
  requestId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = supportUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);
  const { status, resolution } = parsed.data;

  const { data: current } = await supabase
    .from("support_requests")
    .select("id, ticket, name, email, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!current) return failedForm("This message no longer exists.");

  const resolving = status === "resolved" && current.status !== "resolved";
  const { error } = await supabase
    .from("support_requests")
    .update({
      status,
      resolution,
      resolved_at:
        status === "resolved" ? (resolving ? new Date().toISOString() : undefined) : null,
    })
    .eq("id", requestId);
  if (error) return failedForm(`Couldn't save: ${error.message}`);

  if (resolving && resolution) {
    await sendEmail({
      to: current.email,
      ...supportResolvedEmail({ ticket: current.ticket, name: current.name, resolution }),
    });
  }

  revalidatePath(`/admin/messages/${requestId}`);
  revalidatePath("/admin/messages");
  return {
    status: "saved",
    message: resolving ? "Resolved. The customer has been emailed your note." : "Saved.",
  };
}
