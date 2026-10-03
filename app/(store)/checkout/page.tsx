import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { CheckoutStart } from "@/components/checkout/CheckoutStart";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { requireUser } from "@/lib/server/auth";
import { getAddresses, getHeldItems } from "@/lib/server/checkout";
import { getRazorpayConfig } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Checkout (CLAUDE.md §8–9). Signed-in only. Shows the pieces held for this shopper with the hold
// countdown, the address and coupon steps, and the Razorpay payment. With nothing on hold it
// offers to hold the cart first.
export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { supabase, user } = await requireUser("/checkout");
  const params = await searchParams;
  const taken = Number(Array.isArray(params.taken) ? params.taken[0] : params.taken) || 0;

  const [{ items, reservedUntil }, addresses, { data: profile }] = await Promise.all([
    getHeldItems(user),
    getAddresses(supabase),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="mt-4 mb-6 text-2xl font-bold md:text-3xl">Checkout</h1>

      {taken > 0 && items.length > 0 ? (
        <p role="status" className="mb-6 rounded-md bg-surface p-3 text-sm">
          {taken === 1 ? "One piece" : `${taken} pieces`} in your cart sold or went on hold for
          someone else just now, so {taken === 1 ? "it isn't" : "they aren't"} included.
        </p>
      ) : null}

      {items.length > 0 && reservedUntil ? (
        <CheckoutFlow
          items={items}
          reservedUntil={reservedUntil}
          addresses={addresses}
          contact={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "" }}
          paymentsEnabled={getRazorpayConfig() !== null}
        />
      ) : (
        <CheckoutStart />
      )}
    </div>
  );
}
