"use client";

import { SelectField, TextField } from "./FormField";
import { FormFooter } from "./FormFooter";
import { useAdminForm } from "./useAdminForm";
import { updateOrder } from "@/lib/actions/admin/orders";
import { nextOrderStatuses } from "@/lib/admin/orders";
import { orderStatuses, type OrderStatus } from "@/lib/config/orders";

type Props = { orderId: string; status: OrderStatus; trackingUrl: string | null };

export function OrderForm({ orderId, status, trackingUrl }: Props) {
  const { state, pending, formProps, errors } = useAdminForm(updateOrder.bind(null, orderId));
  const options = [status, ...nextOrderStatuses[status]].map((s) => ({
    value: s,
    label: s === status ? `${orderStatuses[s].label} (current)` : orderStatuses[s].label,
  }));

  return (
    <form {...formProps} className="space-y-4">
      <SelectField
        name="status"
        label="Status"
        options={options}
        defaultValue={status}
        error={errors.status}
        hint="The customer is emailed when this changes. Issue refunds in the Razorpay dashboard first, then mark the order Refunded."
      />
      <TextField
        name="tracking_url"
        label="Tracking link"
        type="url"
        placeholder="https://…"
        defaultValue={trackingUrl}
        error={errors.tracking_url}
        hint="Included in the 'shipped' email and shown on the customer's order page."
      />
      <FormFooter state={state} pending={pending} submitLabel="Update order" />
    </form>
  );
}
