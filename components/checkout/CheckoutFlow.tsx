"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Address } from "@/lib/actions/addresses";
import { holdCart, previewCoupon } from "@/lib/actions/checkout";
import type { CheckoutFailed, CheckoutStarted, HeldItem, VerifyResult } from "@/lib/checkout/types";
import { returnsPolicy } from "@/lib/config/legal";
import { shippingFor } from "@/lib/config/shipping";
import { site } from "@/lib/config/site";
import { useCartStore } from "@/lib/stores/cart";
import { addressLines, displayPhone } from "@/lib/utils/address";
import { formatConverted, formatMoney } from "@/lib/utils/money";
import { AddressForm } from "./AddressForm";
import { HoldCountdown, useSecondsLeft } from "./HoldCountdown";
import { RAZORPAY_SCRIPT_URL, type RazorpaySuccess } from "./razorpay";

type Props = {
  items: HeldItem[];
  reservedUntil: string;
  addresses: Address[];
  /** Prefill for a new address. */
  contact: { name: string; phone: string };
  paymentsEnabled: boolean;
  /** What orders shipping abroad are charged in (lib/server/payments.ts). */
  internationalCurrency: "INR" | "USD";
};

// The checkout page's interactive part: address, coupon, summary and the Razorpay payment.
// Totals shown here are estimates; /api/checkout recomputes them from the database and Razorpay
// charges the server's amount. Checkout is in rupees (what Razorpay charges); visitors abroad also
// see the total converted into their currency.
export function CheckoutFlow({
  items,
  reservedUntil,
  addresses: initialAddresses,
  contact,
  paymentsEnabled,
  internationalCurrency,
}: Props) {
  const router = useRouter();
  const { currency, rates, format } = useCurrency();
  const secondsLeft = useSecondsLeft(reservedUntil);
  const expired = secondsLeft === 0;

  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(
    initialAddresses.find((a) => a.isDefault)?.id ?? initialAddresses[0]?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(initialAddresses.length === 0);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [rehold, setRehold] = useState(false);

  const productIds = items.map((i) => i.id);
  const subtotal = items.reduce((sum, i) => sum + i.pricePaise, 0);
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const abroad = selectedAddress ? selectedAddress.country !== "IN" : false;
  const shippingCost = shippingFor(selectedAddress?.country ?? "IN", rates.USD);
  const discount = Math.min(coupon?.discountPaise ?? 0, subtotal);
  const total = subtotal + shippingCost - discount;
  // Estimate only: /api/checkout converts the server's total at the same daily rate.
  const chargedInUsd = abroad && internationalCurrency === "USD";
  const payLabel = chargedInUsd
    ? `Pay ${formatConverted(total, "USD", rates.USD)}`
    : `Pay ${formatMoney(total)}`;

  async function applyCoupon(event: React.FormEvent) {
    event.preventDefault();
    setCouponError(null);
    setCouponBusy(true);
    const result = await previewCoupon(couponInput, productIds);
    setCouponBusy(false);
    if (!result.ok) {
      setCouponError(result.message);
      return;
    }
    setCoupon(result.data);
    setCouponInput("");
  }

  async function holdAgain() {
    setRehold(true);
    setError(null);
    const result = await holdCart(productIds);
    setRehold(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function verify(orderId: string, response: RazorpaySuccess) {
    const res = await fetch("/api/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...response }),
    });
    const body = (await res.json()) as VerifyResult;
    // Even if verification hiccups, the webhook confirms the payment; the order page shows it.
    void useCartStore.getState().refresh();
    router.replace(`/order/${body.ok ? body.orderId : orderId}`);
  }

  async function pay() {
    if (!addressId) {
      setError("Choose a delivery address first.");
      return;
    }
    if (!window.Razorpay) {
      setError("The payment window hasn't loaded yet. Check your connection and try again.");
      return;
    }
    setError(null);
    setPaying(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds, addressId, couponCode: coupon?.code }),
    });
    const body = (await res.json()) as CheckoutStarted | CheckoutFailed;

    if (!body.ok) {
      setPaying(false);
      if (body.needsLogin) {
        router.push("/login?next=/checkout");
        return;
      }
      if (body.field === "coupon") {
        setCoupon(null);
        setCouponError(body.message);
        return;
      }
      if (body.unavailableProductIds?.length) {
        const cart = useCartStore.getState();
        await Promise.all(body.unavailableProductIds.map((id) => cart.remove(id)));
        router.refresh();
      }
      setError(body.message);
      return;
    }

    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-primary")
      .trim();
    const checkout = new window.Razorpay({
      key: body.keyId,
      amount: body.amount,
      // Must match the Razorpay order's currency (lib/server/payments.ts): INR, or USD for
      // international orders when that's switched on.
      currency: body.currency,
      name: site.name,
      description: `Order #${body.orderId.slice(0, 8).toUpperCase()}`,
      order_id: body.razorpayOrderId,
      prefill: body.prefill,
      // Razorpay's modal runs in its own iframe, so it needs a resolved color, not a CSS var
      // reference. The fallback mirrors --color-primary in app/globals.css for the rare case the
      // custom property can't be read.
      theme: { color: primary || "#8855d9" },
      handler: (response) => void verify(body.orderId, response),
      modal: {
        escape: true,
        // Closed without paying: the pieces stay held until the timer runs out.
        ondismiss: () => setPaying(false),
      },
    });
    checkout.on("payment.failed", (response) => {
      setError(
        `${response.error.description ?? "The payment didn't go through."} You can try again — nothing was charged.`,
      );
    });
    checkout.open();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <Script src={RAZORPAY_SCRIPT_URL} strategy="lazyOnload" />

      <div className="space-y-8">
        <HoldCountdown secondsLeft={secondsLeft} />

        <section aria-labelledby="checkout-address">
          <h2 id="checkout-address" className="mb-4 text-xl font-bold">
            Delivery address
          </h2>
          {addresses.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="sr-only">Choose a delivery address</legend>
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 has-checked:border-fg"
                >
                  <input
                    type="radio"
                    name="address"
                    value={a.id}
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="text-sm">
                    <span className="block font-semibold">{a.name}</span>
                    <span className="block text-muted">{addressLines(a).join(", ")}</span>
                    <span className="block text-muted">{displayPhone(a)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {addingAddress ? (
            <div
              className={
                addresses.length > 0 ? "mt-6 rounded-lg border border-border p-4" : undefined
              }
            >
              <AddressForm
                defaults={contact}
                onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
                onSaved={(address) => {
                  setAddresses((list) => [...list, address]);
                  setAddressId(address.id);
                  setAddingAddress(false);
                }}
              />
            </div>
          ) : (
            <Button variant="link" className="mt-4" onClick={() => setAddingAddress(true)}>
              Add a new address
            </Button>
          )}
        </section>

        <section aria-labelledby="checkout-coupon">
          <h2 id="checkout-coupon" className="mb-4 text-xl font-bold">
            Coupon
          </h2>
          {coupon ? (
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface px-4 py-3 text-sm">
              <p>
                <strong>{coupon.code}</strong> applied — you save {formatMoney(discount)}.
              </p>
              <Button variant="link" onClick={() => setCoupon(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void applyCoupon(e)} noValidate className="flex gap-2">
              <label htmlFor="coupon-code" className="sr-only">
                Coupon code
              </label>
              <Input
                id="coupon-code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Coupon code"
                aria-invalid={couponError ? true : undefined}
                aria-describedby={couponError ? "coupon-error" : undefined}
              />
              <Button type="submit" variant="outline" disabled={couponBusy || !couponInput.trim()}>
                {couponBusy ? "Checking…" : "Apply"}
              </Button>
            </form>
          )}
          {couponError ? (
            <p id="coupon-error" role="alert" className="mt-2 text-sm text-sale">
              {couponError}
            </p>
          ) : null}
        </section>
      </div>

      <aside
        aria-labelledby="checkout-summary"
        className="rounded-lg border border-border lg:sticky lg:top-28"
      >
        <h2
          id="checkout-summary"
          className="border-b border-border px-4 py-3 text-lg font-bold md:px-6"
        >
          Your order ({items.length})
        </h2>
        <ul className="divide-y divide-border px-4 md:px-6">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <Link
                  href={`/p/${item.slug}`}
                  className="line-clamp-2 font-semibold hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-muted">
                  {[item.brand, item.taggedSize && `Size ${item.taggedSize}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatMoney(item.pricePaise)}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-border px-4 py-4 md:px-6">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{formatMoney(shippingCost)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-sale">
                <dt>Coupon {coupon?.code}</dt>
                <dd>−{formatMoney(discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
          {chargedInUsd ? (
            <p className="mt-1 text-right text-sm text-muted">
              Charged in US dollars: ≈ {formatConverted(total, "USD", rates.USD)}
            </p>
          ) : currency !== "INR" ? (
            <p className="mt-1 text-right text-sm text-muted">≈ {format(total)}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            {abroad
              ? "Inclusive of Indian taxes. Any import duties or taxes in your country are paid on delivery."
              : "Inclusive of all taxes. No other charges."}
            {chargedInUsd
              ? " You pay in US dollars, converted from the rupee price at today's rate."
              : currency !== "INR"
                ? " You pay in Indian rupees; your bank converts at its own rate."
                : null}
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-md bg-surface p-3 text-sm text-sale">
              {error}
            </p>
          ) : null}

          {expired ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">
                Your 15-minute hold has ended, so these pieces are back on the shelf. Hold them
                again to finish checking out — if nobody&rsquo;s grabbed them.
              </p>
              <Button size="lg" fullWidth disabled={rehold} onClick={() => void holdAgain()}>
                {rehold ? "Holding…" : "Hold them again"}
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="lg"
                fullWidth
                className="mt-4"
                disabled={!paymentsEnabled || paying || !addressId}
                onClick={() => void pay()}
              >
                {paying ? "Opening payment…" : payLabel}
              </Button>
              <p className="mt-2 text-center text-xs text-muted">
                {paymentsEnabled
                  ? abroad
                    ? chargedInUsd
                      ? "Cards and PayPal via Razorpay."
                      : "International cards via Razorpay."
                    : "UPI, cards and netbanking via Razorpay."
                  : "Online payments aren't switched on yet."}
              </p>
              {!returnsPolicy.changeOfMind ? (
                <p className="mt-3 rounded-md bg-surface p-3 text-xs leading-relaxed">
                  <strong>All sales are final.</strong> Please review the photos, condition and
                  measurements above before paying — we don&rsquo;t accept returns for size, fit,
                  colour or change of mind.
                </p>
              ) : null}
              {/* Terms shown before payment, never pre-accepted (E-Commerce Rules 2020 r. 4(9)). */}
              <p className="mt-3 text-xs text-muted">
                By paying, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/returns" className="underline hover:text-primary">
                  Returns &amp; cancellation policy
                </Link>
                . You can cancel free of charge until your order ships. Your details are used as
                described in our{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  Privacy notice
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
