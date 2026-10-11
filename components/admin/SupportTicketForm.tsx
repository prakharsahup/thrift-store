"use client";

import { SelectField, TextAreaField } from "./FormField";
import { FormFooter } from "./FormFooter";
import { useAdminForm } from "./useAdminForm";
import { updateSupportRequest } from "@/lib/actions/admin/support";
import { supportStatuses, type SupportStatus } from "@/lib/validators/support";

type Props = { requestId: string; status: SupportStatus; resolution: string | null };

export function SupportTicketForm({ requestId, status, resolution }: Props) {
  const { state, pending, formProps, errors } = useAdminForm(
    updateSupportRequest.bind(null, requestId),
  );
  const options = (Object.keys(supportStatuses) as SupportStatus[]).map((s) => ({
    value: s,
    label: s === status ? `${supportStatuses[s]} (current)` : supportStatuses[s],
  }));

  return (
    <form {...formProps} className="space-y-4">
      <SelectField
        name="status"
        label="Status"
        options={options}
        defaultValue={status}
        error={errors.status}
      />
      <TextAreaField
        name="resolution"
        label="Resolution note"
        rows={5}
        defaultValue={resolution}
        error={errors.resolution}
        hint="What you did. Required to resolve — it's emailed to the customer, with how to escalate."
      />
      <FormFooter state={state} pending={pending} submitLabel="Update ticket" />
    </form>
  );
}
