import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Package, ShieldCheck } from "lucide-react";
import { LinkIdentityForm } from "@/components/auth/LinkIdentityForm";
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
  // Adding a phone number texts a code, so offer it only once an SMS provider is set up.
  const phoneEnabled = process.env.NEXT_PUBLIC_AUTH_PHONE_ENABLED === "true";

  const sections = [
    {
      href: "/wishlist",
      label: "Wishlist",
      body: "Pieces you've saved.",
      Icon: Heart,
      ready: true,
    },
    {
      href: "/account/orders",
      label: "Orders",
      body: "Track what you've bought.",
      Icon: Package,
      ready: true,
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      body: "Where we deliver.",
      Icon: MapPin,
      ready: true,
    },
    {
      href: "/account/privacy",
      label: "Privacy & data",
      body: "Download or delete your data.",
      Icon: ShieldCheck,
      ready: true,
    },
  ];

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">
          {profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "Hi there"}
        </h1>
        <SignOutButton />
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {!user.email || (!user.phone && phoneEnabled) ? (
        <section aria-labelledby="account-signin" className="mt-12 max-w-md">
          <h2 id="account-signin" className="mb-2 text-xl font-bold">
            Sign-in methods
          </h2>
          <p className="mb-6 text-sm text-muted">
            You currently sign in with {user.email ? "your email" : "your phone number"} only. Add{" "}
            {user.email ? "a phone number" : "an email"} so you can use either — and so a code sent
            the other way doesn&rsquo;t accidentally create a second account.
          </p>
          <LinkIdentityForm kind={user.email ? "phone" : "email"} />
        </section>
      ) : null}
    </div>
  );
}
