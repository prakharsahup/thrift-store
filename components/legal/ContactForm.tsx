"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, inputVariants } from "@/components/ui/Input";
import { submitSupportRequest, type SupportFormState } from "@/lib/actions/support";
import { cn } from "@/lib/utils/cn";
import { supportTopics, type SupportTopic } from "@/lib/validators/support";

type Props = {
  defaults: {
    name: string;
    email: string;
    phone: string;
    topic: SupportTopic | "";
    orderRef: string;
  };
};

const initialState: SupportFormState = { status: "idle", message: "" };

type FieldProps = {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: (aria: { "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
};

function Field({ id, label, optional, hint, error, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
      </label>
      {children({
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Contact and grievance form. Every message becomes a ticket: the sender gets an acknowledgement
// email with the ticket number at once (E-Commerce Rules 2020 r. 4(5)). The form isn't reset on
// a validation error, so nothing typed is lost.
export function ContactForm({ defaults }: Props) {
  const [state, dispatch, pending] = useActionState(submitSupportRequest, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg bg-surface p-6">
        <p className="font-display text-lg font-bold">Message sent</p>
        <p className="mt-2 text-sm">{state.message}</p>
        <p className="mt-2 text-sm text-muted">
          Didn&rsquo;t get the email? Check your spam folder, or quote the ticket number if you
          write to us directly.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => dispatch(formData));
      }}
    >
      {state.status === "error" ? (
        <p role="alert" className="rounded-md bg-surface p-3 text-sm text-sale">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Name" error={errors.name}>
          {(aria) => (
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              required
              defaultValue={defaults.name}
              {...aria}
            />
          )}
        </Field>
        <Field id="contact-email" label="Email" error={errors.email}>
          {(aria) => (
            <Input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={defaults.email}
              {...aria}
            />
          )}
        </Field>
        <Field id="contact-phone" label="Mobile number" optional error={errors.phone}>
          {(aria) => (
            <Input
              id="contact-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={defaults.phone}
              {...aria}
            />
          )}
        </Field>
        <Field
          id="contact-order"
          label="Order number"
          optional
          hint="Like #7F3A2C1B — it's on your order page and emails."
          error={errors.orderRef}
        >
          {(aria) => (
            <Input
              id="contact-order"
              name="orderRef"
              autoComplete="off"
              defaultValue={defaults.orderRef}
              {...aria}
            />
          )}
        </Field>
      </div>

      <Field id="contact-topic" label="What's it about?" error={errors.topic}>
        {(aria) => (
          <select
            id="contact-topic"
            name="topic"
            required
            defaultValue={defaults.topic}
            className={inputVariants()}
            {...aria}
          >
            <option value="" disabled>
              Choose…
            </option>
            {(Object.keys(supportTopics) as SupportTopic[]).map((topic) => (
              <option key={topic} value={topic}>
                {supportTopics[topic]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field id="contact-message" label="Message" error={errors.message}>
        {(aria) => (
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            maxLength={5000}
            className={cn(inputVariants(), "h-auto py-2")}
            {...aria}
          />
        )}
      </Field>

      {/* Honeypot for bots: hidden from people and from assistive technology. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-xs text-muted">
        We use these details only to answer you, and keep the message for up to 3 years after
        it&rsquo;s resolved. See our{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy notice
        </Link>
        .
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
