import type { Metadata } from "next";
import { AddressBook } from "@/components/checkout/AddressBook";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { requireUser } from "@/lib/server/auth";
import { getAddresses } from "@/lib/server/checkout";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const { supabase, user } = await requireUser("/account/addresses");
  const [addresses, { data: profile }] = await Promise.all([
    getAddresses(supabase),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Addresses" },
        ]}
      />
      <h1 className="mt-4 mb-6 text-2xl font-bold md:text-3xl">Addresses</h1>
      <AddressBook
        addresses={addresses}
        defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "" }}
      />
    </div>
  );
}
