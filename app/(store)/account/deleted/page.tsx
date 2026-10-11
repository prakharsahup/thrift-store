import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = { title: "Account deleted", robots: { index: false } };

// Where the "Delete my account" flow lands (lib/actions/privacy.ts). Static: the shopper is
// already signed out by the time they get here.
export default function AccountDeletedPage() {
  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account deleted" }]} />
      <div role="status" className="max-w-2xl py-12 md:py-20">
        <h1 className="text-2xl font-bold md:text-3xl">Your account has been deleted</h1>
        <p className="mt-4 max-w-prose text-muted">
          We&rsquo;ve erased your sign-in, profile, saved addresses, cart, wishlist and email
          alerts. Records of past orders that tax law requires us to keep are no longer linked to
          you, and are deleted when the retention period ends (see our{" "}
          <Link href="/privacy#retention" className="font-semibold text-fg underline">
            Privacy notice
          </Link>
          ).
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/contact?topic=privacy" variant="outline">
            Questions? Contact us
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
