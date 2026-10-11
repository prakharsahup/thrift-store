"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { unsubscribeAll, type UnsubscribeState } from "@/lib/actions/privacy";

/** Withdraws consent to all email alerts in one click — as easy as giving it (DPDP Act s. 6(4)). */
export function UnsubscribeButton() {
  const [state, setState] = useState<UnsubscribeState>({ status: "idle", message: "" });
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        variant="outline"
        disabled={pending || state.status === "done"}
        onClick={() => startTransition(async () => setState(await unsubscribeAll()))}
      >
        {pending ? "Unsubscribing…" : "Unsubscribe from all alerts"}
      </Button>
      <p
        role="status"
        className={state.status === "error" ? "mt-2 text-sm text-sale" : "mt-2 text-sm text-muted"}
      >
        {state.message}
      </p>
    </div>
  );
}
