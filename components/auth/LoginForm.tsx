"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { emailSchema, otpSchema, phoneSchema } from "@/lib/validators/auth";

type Props = {
  /** Where to go after signing in (already checked to be a same-site path). */
  next: string;
  googleEnabled: boolean;
  phoneEnabled: boolean;
};

type Method = "email" | "phone";

const methodCopy = {
  email: { tab: "Email", send: "Email me a sign-in code", other: "Use a different email" },
  phone: { tab: "Phone", send: "Text me a sign-in code", other: "Use a different number" },
} as const;

/** "+919876543210" → "+91 98765 43210", for the "we sent a code to…" notice. */
function formatPhone(e164: string): string {
  const digits = e164.slice(3);
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

// Passwordless sign-in (CLAUDE.md §8): enter an email or an Indian mobile number, receive a 6-digit
// code, type it here. New emails and numbers get an account automatically. Uses the browser
// Supabase client (public anon key only), so the session cookie is set and the cart merges as soon
// as the code is accepted. Google goes through /auth/callback instead.
export function LoginForm({ next, googleEnabled, phoneEnabled }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<"contact" | "code">("contact");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  /** The normalised email or E.164 number the code went to. */
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function chooseMethod(value: Method) {
    setMethod(value);
    setError(null);
    setNotice(null);
  }

  async function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setNotice(null);

    const parsed = method === "email" ? emailSchema.safeParse(email) : phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check what you typed and try again.");
      return;
    }

    setBusy(true);
    const auth = createClient().auth;
    const { error: sendError } =
      method === "email"
        ? await auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: true } })
        : await auth.signInWithOtp({ phone: parsed.data, options: { shouldCreateUser: true } });
    setBusy(false);

    if (sendError) {
      setError(
        sendError.status === 429
          ? "Too many codes requested. Wait a minute, then try again."
          : method === "email"
            ? "We couldn't send a code to that address. Check it and try again."
            : "We couldn't text a code to that number. Check it and try again.",
      );
      return;
    }
    setSentTo(parsed.data);
    setStep("code");
    setNotice(
      method === "email"
        ? `We sent a 6-digit code to ${parsed.data}.`
        : `We texted a 6-digit code to ${formatPhone(parsed.data)}.`,
    );
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
    const auth = createClient().auth;
    const { error: verifyError } =
      method === "email"
        ? await auth.verifyOtp({ email: sentTo, token: parsed.data, type: "email" })
        : await auth.verifyOtp({ phone: sentTo, token: parsed.data, type: "sms" });
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
      setError("Google sign-in isn't available right now. Use a code instead.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      {phoneEnabled && step === "contact" ? (
        <div role="group" aria-label="Sign in with" className="mb-6 flex rounded-md bg-surface p-1">
          {(["email", "phone"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === value}
              onClick={() => chooseMethod(value)}
              className={cn(
                "h-10 flex-1 rounded-sm text-sm font-semibold transition-colors",
                method === value ? "bg-bg text-fg ring-1 ring-border" : "text-muted hover:text-fg",
              )}
            >
              {methodCopy[value].tab}
            </button>
          ))}
        </div>
      ) : null}

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

      {step === "contact" ? (
        <form onSubmit={(e) => void sendCode(e)} noValidate className="space-y-4">
          {method === "email" ? (
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-semibold">
                Email address
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="login-phone" className="mb-1 block text-sm font-semibold">
                Mobile number
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted"
                >
                  +91
                </span>
                <Input
                  id="login-phone"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  required
                  aria-describedby="login-phone-hint"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-12"
                />
              </div>
              <p id="login-phone-hint" className="mt-1 text-xs text-muted">
                Indian (+91) mobile numbers only. Standard SMS rates may apply.
              </p>
            </div>
          )}
          <Button type="submit" disabled={busy} fullWidth>
            {busy ? "Sending…" : methodCopy[method].send}
          </Button>
        </form>
      ) : (
        <form onSubmit={(e) => void verifyCode(e)} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-code" className="mb-1 block text-sm font-semibold">
              6-digit code
            </label>
            <Input
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              fieldSize="lg"
              className="text-center font-display text-xl tracking-widest"
            />
          </div>
          <Button type="submit" disabled={busy} fullWidth>
            {busy ? "Checking…" : "Sign in"}
          </Button>
          <div className="flex justify-between gap-4">
            <Button
              variant="link"
              onClick={() => {
                setStep("contact");
                setCode("");
                setNotice(null);
                setError(null);
              }}
            >
              {methodCopy[method].other}
            </Button>
            <Button variant="link" disabled={busy} onClick={() => void sendCode()}>
              Send a new code
            </Button>
          </div>
        </form>
      )}

      {googleEnabled && step === "contact" ? (
        <>
          <p className="my-6 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            or
          </p>
          <Button
            variant="outline"
            onClick={() => void signInWithGoogle()}
            disabled={busy}
            fullWidth
          >
            Continue with Google
          </Button>
        </>
      ) : null}
    </div>
  );
}
