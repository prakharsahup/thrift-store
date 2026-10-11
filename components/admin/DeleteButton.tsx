"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  /** A bound server action; it redirects on success and returns a message on failure. */
  action: () => Promise<{ ok: boolean; message?: string }>;
  /** e.g. "Delete drop". */
  label: string;
};

// Two-step delete: the first click asks, the second deletes.
export function DeleteButton({ action, label }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {confirming ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await action();
                if (!result.ok) {
                  setError(result.message ?? "Couldn't delete.");
                  setConfirming(false);
                }
              })
            }
          >
            Yes, delete
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
          {label}
        </Button>
      )}
      {error ? (
        <p role="alert" className="w-full text-sm text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}
