import { NextResponse } from "next/server";
import { site } from "@/lib/config/site";
import { getUser } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Right to access (DPDP Act 2023 s. 11): everything we hold about the signed-in shopper, as a
// JSON download. Reads go through the shopper's own session (RLS), except email alerts, which are
// keyed by email address rather than account.
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  }

  const [profile, addresses, wishlist, cart, orders, support, alerts] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select("name, phone, line1, line2, city, state, pincode, is_default, created_at"),
    supabase.from("wishlists").select("created_at, product:products(slug, title)"),
    supabase.from("cart_items").select("added_at, product:products(slug, title)"),
    supabase
      .from("orders")
      .select(
        `id, status, created_at, subtotal_paise, shipping_paise, discount_paise, total_paise,
         coupon_code, address, payment_method, razorpay_payment_id, tracking_url,
         order_items(title_snapshot, price_paise_snapshot, unavailable)`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("support_requests")
      .select("ticket, created_at, topic, order_ref, message, status, resolution, resolved_at"),
    user.email
      ? createAdminClient()
          .from("notify_requests")
          .select("created_at, confirmed_at, notified_at, drop_id, product_id")
          .eq("email", user.email.toLowerCase())
      : Promise.resolve({ data: [], error: null }),
  ]);

  const failed = [profile, addresses, wishlist, cart, orders, support, alerts].find((r) => r.error);
  if (failed?.error) {
    console.error("[privacy] export failed:", failed.error);
    return NextResponse.json(
      { error: "We couldn't gather your data just now. Try again." },
      { status: 500 },
    );
  }

  const body = {
    exported_at: new Date().toISOString(),
    exported_from: site.url,
    note: "Amounts are in cents ($1 = 100 cents). Card and bank details are never stored by us.",
    account: {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone || null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    },
    profile: profile.data,
    addresses: addresses.data,
    wishlist: wishlist.data,
    cart: cart.data,
    orders: orders.data,
    support_requests: support.data,
    email_alerts: alerts.data,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${site.name}-my-data-${date}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
