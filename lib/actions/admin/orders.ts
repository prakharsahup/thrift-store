"use server";

import { revalidatePath } from "next/cache";
import { failedForm, invalidForm, type FormState } from "@/lib/admin/form";
import { nextOrderStatuses } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/server/auth";
import { isNotifiableStatus, orderStatusEmail, sendEmail } from "@/lib/server/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderUpdateSchema } from "@/lib/validators/admin";

/**
 * Moves an order along (packed → shipped → delivered, or refunded / cancelled) and/or sets its
 * tracking link. The customer is emailed whenever the status changes.
 */
export async function updateOrder(
  orderId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = orderUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);
  const { status, tracking_url } = parsed.data;

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id, tracking_url")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return failedForm("This order no longer exists.");

  const changingStatus = status !== order.status;
  if (changingStatus && !nextOrderStatuses[order.status].includes(status)) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { status: `A ${order.status} order can't be marked ${status}.` },
    };
  }

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status, tracking_url })
    .eq("id", orderId)
    .eq("status", order.status) // Matches nothing if the status changed meanwhile.
    .select("id");
  if (error) return failedForm(`Couldn't save: ${error.message}`);
  if (updated.length === 0) {
    return failedForm("This order changed while you were looking at it. Reload and try again.");
  }

  let emailed = false;
  if (changingStatus && isNotifiableStatus(status) && order.user_id) {
    const { data } = await createAdminClient().auth.admin.getUserById(order.user_id);
    if (data.user?.email) {
      await sendEmail({
        to: data.user.email,
        ...orderStatusEmail({ id: order.id, status, trackingUrl: tracking_url }),
      });
      emailed = true;
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {
    status: "saved",
    message: changingStatus
      ? `Marked ${status}.${emailed ? " The customer has been emailed." : " (No email on file, so no email was sent.)"}`
      : "Saved.",
  };
}
