"use client";

import Link from "next/link";
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
    <form action={formAction} noValidate className="w-full max-w-xl lg:justify-self-end">
      <label
        htmlFor="newsletter-email"
        className="mb-2 block text-xs font-bold tracking-widest uppercase"
      >
        Email
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
        <Button type="submit" disabled={pending}>
          {pending ? "Signing up…" : "Notify me"}
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
      <p className="text-xs text-muted">
        Drop alerts only. Unsubscribe any time; see our{" "}
        <Link href="/privacy" className="underline hover:text-fg">
          Privacy notice
        </Link>
        .
      </p>
    </form>
  );
}
