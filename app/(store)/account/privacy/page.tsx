import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { UnsubscribeButton } from "@/components/account/UnsubscribeButton";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { grievanceOfficer } from "@/lib/config/legal";
import { requireUser } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Privacy & data", robots: { index: false } };

// The shopper's data rights in one place (DPDP Act 2023 ss. 11–14): access (download), correction
// (profile and addresses), withdrawing consent (alerts) and erasure (delete account).
export default async function PrivacyDataPage() {
  const { user } = await requireUser("/account/privacy");

  // Email alerts are keyed by address, not account, so they're read with the service role.
  const { count: alertCount } = user.email
    ? await createAdminClient()
        .from("notify_requests")
        .select("id", { count: "exact", head: true })
        .eq("email", user.email.toLowerCase())
    : { count: 0 };

  const sectionClass = "border-t border-border py-8";

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Privacy & data" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold md:text-3xl">Privacy &amp; data</h1>
      <p className="mt-2 max-w-prose text-muted">
        Your rights under India&rsquo;s Digital Personal Data Protection Act, in one place. Our{" "}
        <Link href="/privacy" className="font-semibold text-fg underline hover:text-primary">
          Privacy notice
        </Link>{" "}
        explains what we collect and why.
      </p>

      <div className="mt-8 max-w-2xl">
        <section aria-labelledby="privacy-download" className={sectionClass}>
          <h2 id="privacy-download" className="text-lg font-bold">
            Download your data
          </h2>
          <p className="mt-2 text-sm text-muted">
            A file with your account details, addresses, orders, wishlist, cart, messages and email
            alerts.
          </p>
          {/* A plain link: the route returns a file download. */}
          <a
            href="/account/privacy/export"
            download
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 hover:text-fg"
          >
            <Download aria-hidden className="size-4" />
            Download my data (JSON)
          </a>
        </section>

        <section aria-labelledby="privacy-correct" className={sectionClass}>
          <h2 id="privacy-correct" className="text-lg font-bold">
            Correct your details
          </h2>
          <p className="mt-2 text-sm text-muted">
            Edit your name and number on{" "}
            <Link href="/account" className="font-semibold text-fg underline hover:text-primary">
              your account
            </Link>
            , and your delivery addresses under{" "}
            <Link
              href="/account/addresses"
              className="font-semibold text-fg underline hover:text-primary"
            >
              Addresses
            </Link>
            . To change the email or number you sign in with, contact us.
          </p>
        </section>

        <section aria-labelledby="privacy-alerts" className={sectionClass}>
          <h2 id="privacy-alerts" className="text-lg font-bold">
            Email alerts
          </h2>
          <p className="mt-2 text-sm text-muted">
            {alertCount
              ? `You're signed up for ${alertCount} drop or restock alert${alertCount === 1 ? "" : "s"} at ${user.email}.`
              : "You're not signed up for any drop or restock alerts. We only send order and account emails."}
          </p>
          {alertCount ? (
            <div className="mt-4">
              <UnsubscribeButton />
            </div>
          ) : null}
        </section>

        <section aria-labelledby="privacy-delete" className={sectionClass}>
          <h2 id="privacy-delete" className="text-lg font-bold">
            Delete your account
          </h2>
          <p className="mt-2 mb-4 text-sm text-muted">
            We&rsquo;ll erase your personal data, except order records the law requires us to keep
            for 8 years.
          </p>
          <DeleteAccountForm />
        </section>

        <section aria-labelledby="privacy-other" className={sectionClass}>
          <h2 id="privacy-other" className="text-lg font-bold">
            Anything else
          </h2>
          <p className="mt-2 text-sm text-muted">
            To nominate someone to act for you, ask what we&rsquo;ve shared and with whom, or make a
            complaint,{" "}
            <Link
              href="/contact?topic=privacy"
              className="font-semibold text-fg underline hover:text-primary"
            >
              contact us
            </Link>{" "}
            or our Grievance Officer at{" "}
            <a
              href={`mailto:${grievanceOfficer.email}`}
              className="font-semibold text-fg underline hover:text-primary"
            >
              {grievanceOfficer.email}
            </a>
            . We reply within 30 days.
          </p>
        </section>
      </div>
    </div>
  );
}
