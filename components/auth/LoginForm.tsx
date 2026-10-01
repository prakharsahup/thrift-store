"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, otpSchema } from "@/lib/validators/auth";

type Props = {
  /** Where to go after signing in (already checked to be a same-site path). */
  next: string;
  googleEnabled: boolean;
};

// Passwordless sign-in (CLAUDE.md §8): enter an email, receive a 6-digit code, type it here.
// New emails get an account automatically. Uses the browser Supabase client (public anon key
// only), so the session cookie is set and the cart merges as soon as the code is accepted.
export function LoginForm({ next, googleEnabled }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error: sendError } = await createClient().auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (sendError) {
      setError(
        sendError.status === 429
          ? "Too many codes requested. Wait a minute, then try again."
          : "We couldn't send a code to that address. Check it and try again.",
      );
      return;
    }
    setEmail(parsed.data);
    setStep("code");
    setNotice(`We sent a 6-digit code to ${parsed.data}.`);
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
    const { error: verifyError } = await createClient().auth.verifyOtp({
      email,
      token: parsed.data,
      type: "email",
    });
    if (verifyError) {
      setBusy(false);
      setError("That code didn't work. It may have expired — request a new one.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    setBusy(true);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setBusy(false);
      setError("Google sign-in isn't available right now. Use your email instead.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      {error ? (
        <p role="alert" className="mb-4 rounded-md bg-surface p-3 text-sm text-sale">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mb-4 text-sm text-muted">
          {notice}
        </p>
      ) : null}

      {step === "email" ? (
        <form onSubmit={(e) => void sendCode(e)} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-semibold">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-md border border-border bg-bg px-3 text-base"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-fg hover:bg-fg disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void verifyCode(e)} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-code" className="mb-1 block text-sm font-semibold">
              6-digit code
            </label>
            <input
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-12 w-full rounded-md border border-border bg-bg px-3 text-center font-display text-xl tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-fg hover:bg-fg disabled:opacity-60"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setNotice(null);
                setError(null);
              }}
              className="font-semibold text-primary underline"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendCode()}
              className="font-semibold text-primary underline disabled:opacity-60"
            >
              Send a new code
            </button>
          </div>
        </form>
      )}

      {googleEnabled && step === "email" ? (
        <>
          <p className="my-6 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            or
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={busy}
            className="h-12 w-full rounded-md border border-fg text-sm font-semibold hover:bg-surface disabled:opacity-60"
          >
            Continue with Google
          </button>
        </>
      ) : null}
    </div>
  );
}
