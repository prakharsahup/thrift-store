"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteProduct, duplicateProduct } from "@/lib/actions/admin/products";

type Props = { productId: string };

// "Duplicate" (speeds up listing similar pieces) and a two-step "Delete".
export function ProductActions({ productId }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => duplicateProduct(productId))}
      >
        Duplicate
      </Button>
      {confirming ? (
        <>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteProduct(productId);
                if (!result.ok) {
                  setError(result.message);
                  setConfirming(false);
                }
              })
            }
          >
            Yes, delete it
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Keep it
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(true)}>
          Delete
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
