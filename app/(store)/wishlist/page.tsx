import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

// Wishlist for everyone: guests' saved pieces live in this browser, members' in their account
// (merged on sign-in). The list renders on the client, so this page itself stays static.
export default function WishlistPage() {
  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <h1 className="mt-4 text-3xl text-accent md:text-4xl">Wishlist</h1>
      <p className="mt-3 max-w-prose text-sm text-muted">
        Saving a piece doesn&rsquo;t hold it: there&rsquo;s only one of each, and the first person
        to check out gets it.{" "}
        <Link href="/login?next=%2Fwishlist" className="text-accent underline underline-offset-4">
          Sign in
        </Link>{" "}
        to keep your wishlist on every device and get an email if a saved piece comes back.
      </p>
      <WishlistView />
    </div>
  );
}
