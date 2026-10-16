"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestDropAlert, type DropAlertState } from "@/lib/actions/notify";
import { cn } from "@/lib/utils/cn";

type Props = { dropId: string; id: string; className?: string };

const initialState: DropAlertState = { status: "idle", message: "" };

// "Notify me" for an upcoming drop. Double opt-in: the server emails a confirmation link first.
export function DropAlertForm({ dropId, id, className }: Props) {
  const [state, formAction, pending] = useActionState(requestDropAlert, initialState);
  const messageId = `${id}-message`;

  return (
    <form action={formAction} noValidate className={cn("w-full max-w-xl", className)}>
      <input type="hidden" name="dropId" value={dropId} />
      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <label htmlFor={id} className="mb-2 block text-xs font-bold tracking-widest uppercase">
        Email
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-describedby={messageId}
          aria-invalid={state.status === "error" || undefined}
          className="flex-1"
        />
        <Button type="submit" disabled={pending || state.status === "done"}>
          {pending ? "Adding…" : state.status === "done" ? "Added" : "Notify me"}
        </Button>
      </div>
      <p
        id={messageId}
        role="status"
        className={cn(
          "mt-2 min-h-5 text-xs",
          state.status === "error"
            ? "text-sale"
            : state.status === "done"
              ? "text-accent"
              : "text-muted",
        )}
      >
        {state.message}
      </p>
      <p className="text-xs text-muted">
        One email when the drop opens, after you confirm your address. See our{" "}
        <Link href="/privacy" className="underline hover:text-fg">
          Privacy notice
        </Link>
        .
      </p>
    </form>
  );
}
