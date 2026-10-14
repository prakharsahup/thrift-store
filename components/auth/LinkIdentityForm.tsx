"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, otpSchema, phoneSchema } from "@/lib/validators/auth";

type Kind = "email" | "phone";

/** Purely a UX cue — the server (Supabase's rate limit) is what actually enforces this. */
const RESEND_COOLDOWN_SECONDS = 30;

const copy: Record<
  Kind,
  { label: string; placeholder: string; send: string; sentPrefix: string; inUse: string }
> = {
  email: {
    label: "Email address",
    placeholder: "you@example.com",
    send: "Send a code to this email",
    sentPrefix: "We sent a 6-digit code to",
    inUse: "We couldn't send a code to that address. It may already be in use.",
  },
  phone: {
    label: "Mobile number",
    placeholder: "98765 43210",
    send: "Text me a code",
    sentPrefix: "We texted a 6-digit code to",
    inUse: "We couldn't text a code to that number. It may already be in use.",
  },
};

/**
 * Lets someone who signed in with only an email add a phone number (or vice versa), so the same
 * account — same cart, same order history — can be reached and signed into either way. Without
 * this, signing in once by email and once by phone silently creates two separate accounts.
 */
export function LinkIdentityForm({ kind }: { kind: Kind }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "code">("input");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const c = copy[kind];

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    const parsed = kind === "email" ? emailSchema.safeParse(value) : phoneSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check what you typed and try again.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await createClient().auth.updateUser(
      kind === "email" ? { email: parsed.data } : { phone: parsed.data },
    );
    setBusy(false);
    if (updateError) {
      setError(
        updateError.status === 429
          ? "Too many codes requested. Wait a minute, then try again."
          : c.inUse,
      );
      return;
    }
    setSentTo(parsed.data);
    setStep("code");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    const { error: verifyError } = await createClient().auth.verifyOtp(
      kind === "email"
        ? { email: sentTo, token: parsed.data, type: "email_change" }
        : { phone: sentTo, token: parsed.data, type: "phone_change" },
    );
    setBusy(false);
    if (verifyError) {
      setError("That code didn't work. It may have expired — request a new one.");
      return;
    }
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={(e) => void verifyCode(e)} noValidate className="space-y-3">
        <p className="text-sm text-muted">
          {c.sentPrefix} {sentTo}.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-sale">
            {error}
          </p>
        ) : null}
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          aria-label="6-digit code"
          className="max-w-[10rem] text-center font-display text-lg tracking-widest"
        />
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Checking…" : "Confirm"}
          </Button>
          <Button
            type="button"
            variant="link"
            disabled={busy || cooldown > 0}
            onClick={() => void sendCode()}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void sendCode(e)} noValidate className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <label htmlFor={`link-${kind}`} className="mb-1 block text-sm font-semibold">
          {c.label}
        </label>
        <Input
          id={`link-${kind}`}
          type={kind === "email" ? "email" : "tel"}
          inputMode={kind === "email" ? "email" : "tel"}
          placeholder={c.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Sending…" : c.send}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-sm text-sale">
          {error}
        </p>
      ) : null}
    </form>
  );
}
