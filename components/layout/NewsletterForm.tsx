"use client";

import { useActionState } from "react";
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
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-describedby="newsletter-message"
          aria-invalid={state.status === "error" || undefined}
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-sm placeholder:text-muted focus:border-fg aria-invalid:border-sale"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-md bg-fg px-4 text-sm font-semibold text-bg disabled:opacity-60"
        >
          {pending ? "Signing up…" : "Sign up"}
        </button>
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
