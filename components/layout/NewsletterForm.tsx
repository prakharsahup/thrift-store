"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { subscribeToNewsletter } from "@/lib/server/newsletter";
import { cn } from "@/lib/utils/cn";

type State = Awaited<ReturnType<typeof subscribeToNewsletter>>;

const initialState: State = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form action={formAction} noValidate className="max-w-sm">
      <label htmlFor="newsletter-email" className="mb-2 block font-display font-bold">
        Get first dibs on new drops
      </label>
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-describedby="newsletter-message"
          aria-invalid={state.status === "error" || undefined}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Signing up…" : "Sign up"}
        </Button>
      </div>
      <p
        id="newsletter-message"
        role="status"
        className={cn(
          "mt-2 min-h-5 text-xs",
          state.status === "error" ? "text-sale" : "text-muted",
        )}
      >
        {state.message}
      </p>
    </form>
  );
}
