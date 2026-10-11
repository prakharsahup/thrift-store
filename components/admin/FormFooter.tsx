"use client";

import { Button } from "@/components/ui/Button";
import type { FormState } from "@/lib/admin/form";

type Props = {
  state: FormState;
  pending: boolean;
  submitLabel: string;
  children?: React.ReactNode;
};

// Save button (disabled while the action runs) and the form-level result message.
export function FormFooter({ state, pending, submitLabel, children }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
      {children}
      {!pending && state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "text-sm text-sale" : "text-sm text-fg"}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
