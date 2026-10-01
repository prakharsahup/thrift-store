import type { Metadata } from "next";
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
          No password needed — we&rsquo;ll email you a code. New here? The same code creates your
          account.
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
          />
        </div>
      </div>
    </div>
  );
}
