import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Package } from "lucide-react";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const { supabase, user } = await requireUser("/account");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const sections = [
    {
      href: "/account/wishlist",
      label: "Wishlist",
      body: "Pieces you've saved.",
      Icon: Heart,
      ready: true,
    },
    {
      href: "/account/orders",
      label: "Orders",
      body: "Arrives with online checkout.",
      Icon: Package,
      ready: false,
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      body: "Arrives with online checkout.",
      Icon: MapPin,
      ready: false,
    },
  ];

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">
          Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <SignOutButton />
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {sections.map(({ href, label, body, Icon, ready }) => (
          <li key={href}>
            {ready ? (
              <Link
                href={href}
                className="flex h-full gap-3 rounded-lg border border-border p-5 hover:border-fg"
              >
                <Icon aria-hidden className="size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-display font-bold">{label}</span>
                  <span className="mt-1 block text-sm text-muted">{body}</span>
                </span>
              </Link>
            ) : (
              <div className="flex h-full gap-3 rounded-lg border border-dashed border-border p-5 text-muted">
                <Icon aria-hidden className="size-5 shrink-0" />
                <span>
                  <span className="block font-display font-bold">{label}</span>
                  <span className="mt-1 block text-sm">{body}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <section aria-labelledby="account-profile" className="mt-12">
        <h2 id="account-profile" className="mb-6 text-xl font-bold">
          Your details
        </h2>
        <ProfileForm
          email={user.email ?? ""}
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </section>
    </div>
  );
}
