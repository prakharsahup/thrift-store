import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { policyUpdated, returnsPolicy, shippingPolicy as s } from "@/lib/config/legal";
import { shipping } from "@/lib/config/shipping";
import { site } from "@/lib/config/site";
import { formatMoney } from "@/lib/utils/money";

const flat = formatMoney(shipping.flatPaise);
const freeAbove = formatMoney(shipping.freeAbovePaise);

export const metadata: Metadata = {
  title: "Shipping policy",
  description: `Where ${site.name} delivers, what it costs (${flat}, free over ${freeAbove}), dispatch times and tracking.`,
  alternates: { canonical: "/shipping" },
};

// TODO(owner): template policy. Charges come from lib/config/shipping.ts and times from
// lib/config/legal.ts (shippingPolicy); keep both in step with your courier contract.
const sections: LegalSection[] = [
  {
    id: "where",
    title: "Where we deliver",
    body: (
      <p>
        We deliver anywhere in India that our courier partners serve. If your pincode can&rsquo;t be
        reached, we&rsquo;ll tell you before dispatch and refund you in full. We don&rsquo;t ship
        outside India.
      </p>
    ),
  },
  {
    id: "cost",
    title: "What it costs",
    body: (
      <>
        <ul>
          <li>
            Orders of {freeAbove} or more: <strong>free shipping</strong>.
          </li>
          <li>
            Orders under {freeAbove}: a flat <strong>{flat}</strong>, wherever you are in India.
          </li>
        </ul>
        <p>
          The shipping charge is shown in your cart and at checkout before you pay. There are no
          other delivery fees, and prices already include all taxes. Cash on delivery isn&rsquo;t
          available at the moment.
        </p>
      </>
    ),
  },
  {
    id: "when",
    title: "When it ships and arrives",
    body: (
      <>
        <p>
          We pack and hand your order to the courier within{" "}
          <strong>{s.dispatchDays} business days</strong> of payment. Business days are Monday to
          Saturday, excluding public holidays.
        </p>
        <p>
          Delivery usually takes <strong>{s.deliveryDays} business days</strong> after dispatch.
          Remote areas, including parts of the North East, Jammu &amp; Kashmir, Ladakh and the
          islands, can take a few days longer. These are estimates, not guarantees, but if your
          order is very late you can cancel it (see{" "}
          <Link href="/returns#late">late deliveries</Link>).
        </p>
      </>
    ),
  },
  {
    id: "tracking",
    title: "Tracking",
    body: (
      <p>
        We email you a tracking link when your order ships. You&rsquo;ll also find it, along with
        the order&rsquo;s status, under <Link href="/account/orders">Account → Orders</Link>.
      </p>
    ),
  },
  {
    id: "packaging",
    title: "Packaging",
    body: (
      <p>
        Pieces are cleaned, folded and sent in recycled or recyclable mailers. Every parcel is
        sealed; please don&rsquo;t accept one that has clearly been opened or tampered with.
      </p>
    ),
  },
  {
    id: "problems",
    title: "Delivery problems",
    body: (
      <>
        <p>
          <strong>Damaged or tampered parcel:</strong> if you can, note it with the courier at
          delivery, then send us photos within {returnsPolicy.windowDays} days. We&rsquo;ll refund
          or resolve it — see <Link href="/returns#not-as-described">Returns</Link>.
        </p>
        <p>
          <strong>Missed delivery:</strong> the courier makes up to three attempts and may call the
          phone number on your address. If the parcel comes back to us because of a wrong address or
          nobody being available, we&rsquo;ll contact you to send it again (shipping charged again)
          or refund the price of the pieces.
        </p>
        <p>
          <strong>Marked delivered but not received:</strong>{" "}
          <Link href="/contact?topic=order">contact us</Link> within 48 hours and we&rsquo;ll open
          an investigation with the courier.
        </p>
      </>
    ),
  },
];

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping policy"
      updated={policyUpdated.shipping}
      summary={
        <ul>
          <li>
            Free shipping on orders of {freeAbove} or more; {flat} below that, anywhere in India.
          </li>
          <li>Dispatched within {s.dispatchDays} business days of payment.</li>
          <li>Delivered in about {s.deliveryDays} business days after that, with tracking.</li>
        </ul>
      }
      sections={sections}
    />
  );
}
