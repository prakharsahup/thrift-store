"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deleteAccount, type DeleteAccountState } from "@/lib/actions/privacy";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/stores/cart";

const initialState: DeleteAccountState = { status: "idle", message: "" };

// Account deletion (right to erasure). Two steps: open the confirmation, then type DELETE.
export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState(deleteAccount, initialState);

  useEffect(() => {
    if (state.status === "deleted") {
      // The user is gone server-side; drop the session in this browser ("local": no network
      // call for a user that no longer exists), then a full page load so the header and cart
      // start again signed out.
      void createClient()
        .auth.signOut({ scope: "local" })
        .finally(() => {
          useCartStore.getState().signedOut();
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full reload: shared layouts (header, cart) must drop the deleted session
          window.location.assign("/account/deleted");
        });
    }
  }, [state.status]);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <form
      noValidate
      className="max-w-md space-y-4 rounded-lg border border-sale p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => dispatch(formData));
      }}
    >
      <p className="text-sm">
        This permanently deletes your sign-in, profile, saved addresses, cart, wishlist and email
        alerts. It can&rsquo;t be undone. Past orders stay in our records for tax purposes, but
        won&rsquo;t be linked to you.
      </p>
      <div>
        <label htmlFor="delete-confirm" className="mb-1 block text-sm font-semibold">
          Type DELETE to confirm
        </label>
        <Input
          id="delete-confirm"
          name="confirm"
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={state.status === "error" ? "delete-error" : undefined}
        />
      </div>
      {state.status === "error" ? (
        <p id="delete-error" role="alert" className="text-sm text-sale">
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || state.status === "deleted"}>
          {pending || state.status === "deleted" ? "Deleting…" : "Delete my account"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
          Keep my account
        </Button>
      </div>
    </form>
  );
}
