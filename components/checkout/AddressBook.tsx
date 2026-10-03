"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAddress, makeDefaultAddress, type Address } from "@/lib/actions/addresses";
import { AddressForm } from "./AddressForm";

type Props = {
  addresses: Address[];
  defaults: { name: string; phone: string };
};

// /account/addresses: saved addresses with "make default" and "delete", plus the add form.
export function AddressBook({ addresses, defaults }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    id: string,
    action: (id: string) => Promise<{ ok: boolean; message?: string }>,
  ) {
    setBusyId(id);
    setError(null);
    const result = await action(id);
    setBusyId(null);
    if (!result.ok) setError(result.message ?? "That didn't work. Try again.");
    else router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error ? (
        <p role="alert" className="rounded-md bg-surface p-3 text-sm text-sale">
          {error}
        </p>
      ) : null}

      {addresses.length > 0 ? (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-lg border border-border p-4 text-sm">
              <p className="font-semibold">
                {a.name}
                {a.isDefault ? (
                  <span className="ml-2 rounded-sm bg-surface px-2 py-0.5 text-xs font-semibold">
                    Default
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-muted">
                {[a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-muted">+91 {a.phone}</p>
              <div className="mt-3 flex gap-4">
                {a.isDefault ? null : (
                  <Button
                    variant="link"
                    disabled={busyId === a.id}
                    onClick={() => void run(a.id, makeDefaultAddress)}
                  >
                    Make default
                  </Button>
                )}
                <Button
                  variant="link"
                  disabled={busyId === a.id}
                  onClick={() => void run(a.id, deleteAddress)}
                  aria-label={`Delete the address for ${a.name}, ${a.line1}`}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <div className="rounded-lg border border-border p-4 md:p-6">
          <h2 className="mb-4 text-lg font-bold">New address</h2>
          <AddressForm
            defaults={defaults}
            onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
            onSaved={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          Add an address
        </Button>
      )}
    </div>
  );
}
