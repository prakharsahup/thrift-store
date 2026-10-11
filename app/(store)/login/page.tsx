import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { site } from "@/lib/config/site";
import { getUser } from "@/lib/server/auth";
import { safeNextPath } from "@/lib/validators/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);
  const callbackFailed = params.error === "callback";

  const { user } = await getUser();
  if (user) redirect(next);

  return (
    <div className="site-container flex flex-col items-center py-16 md:py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold md:text-3xl">Sign in to {site.name}</h1>
        <p className="mt-2 text-sm text-muted">
          No password needed — we&rsquo;ll send you a 6-digit code. New here? The same code creates
          your account.
        </p>
        {callbackFailed ? (
          <p role="alert" className="mt-4 rounded-md bg-surface p-3 text-sm text-sale">
            That sign-in link didn&rsquo;t work. Try again below.
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm
            next={next}
            googleEnabled={process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true"}
            phoneEnabled={process.env.NEXT_PUBLIC_AUTH_PHONE_ENABLED === "true"}
          />
        </div>
        {/* Notice at collection (DPDP Act s. 5) and the 18+ rule (Indian Contract Act; DPDP s. 9). */}
        <p className="mt-8 text-xs text-muted">
          By continuing, you confirm you&rsquo;re 18 or older and agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of service
          </Link>
          . We use your email or mobile number to sign you in and to handle your orders, as
          explained in our{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy notice
          </Link>
          . You can delete your account at any time.
        </p>
      </div>
    </div>
  );
}
