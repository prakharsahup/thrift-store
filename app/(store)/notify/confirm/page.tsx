import type { Metadata } from "next";
import { z } from "zod";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Confirm your alert", robots: { index: false } };

// Double opt-in landing page for drop alerts (link from dropAlertConfirmEmail). Confirms every
// pending alert for the address behind the token.
export default async function ConfirmAlertPage({ searchParams }: PageProps<"/notify/confirm">) {
  const { token } = await searchParams;
  const parsed = z.uuid().safeParse(token);

  let confirmed: number | null = null;
  if (parsed.success) {
    const { data, error } = await createAdminClient().rpc("confirm_notify", {
      token: parsed.data,
    });
    if (error) console.error("[notify] confirm_notify failed:", error);
    else confirmed = data;
  }

  const ok = confirmed !== null;
  return (
    <div className="site-container py-20 md:py-28">
      <p className="text-xs font-bold tracking-widest text-muted uppercase">Drop alert</p>
      <h1 className="mt-3 max-w-3xl text-2xl font-bold md:text-3xl">
        {ok ? "You're on the list." : "That link didn't work."}
      </h1>
      <p className="mt-4 max-w-prose text-base text-muted">
        {ok
          ? "We'll email you once, when the drop goes live. Pehle aao, pehle pao."
          : "It may be mistyped or more than 7 days old. Sign up again from the home page and we'll send a fresh link."}
      </p>
      <ButtonLink href="/" className="mt-8">
        Back to the shop
      </ButtonLink>
    </div>
  );
}
