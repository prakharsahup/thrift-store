import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { conditions, selectableConditions } from "@/lib/config/conditions";
import {
  business,
  externalRedress,
  formatAddress,
  grievanceOfficer,
  jurisdictionCity,
  policyUpdated,
  returnsPolicy,
  shippingPolicy,
} from "@/lib/config/legal";
import { internationalShippingLabel, shipping } from "@/lib/config/shipping";
import { site } from "@/lib/config/site";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: `The terms for buying pre-loved pieces from ${site.name}: eligibility, condition grades, prices, payments, cancellations, shipping and how disputes are handled.`,
  alternates: { canonical: "/terms" },
};

// TODO(owner): template wording for an Indian online thrift store, built from the owner's draft
// terms & conditions (2026-10-14). Have a lawyer review it before launch; the numbers come from
// lib/config/legal.ts and lib/config/shipping.ts.
//
// International shipping is live (2026-10-24): checkout accepts addresses in the countries listed
// in lib/config/countries.ts.
const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is run by {business.legalName}, a{" "}
          {business.entityType.toLowerCase()} at {formatAddress().join(", ")}. These terms apply
          when you browse {site.url.replace(/^https?:\/\//, "")} or buy from us. By creating an
          account or placing an order, you agree to them, along with our{" "}
          <Link href="/privacy">Privacy notice</Link>,{" "}
          <Link href="/returns">Returns, refunds &amp; cancellation policy</Link> and{" "}
          <Link href="/shipping">Shipping policy</Link>.
        </p>
        <p>
          We sell our own stock directly to you. We are not a marketplace and we do not list items
          for other sellers.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can buy",
    body: (
      <p>
        You must be at least 18 years old and able to enter a binding contract under Indian law to
        create an account or buy. You sign in with a one-time code sent to your email or mobile
        number. Keep access to them secure, and give us accurate details: we use them to deliver
        your order and to contact you about it. We may suspend an account used for fraud, abuse of
        offers or anything that breaks these terms, and we will tell you why.
      </p>
    ),
  },
  {
    id: "about-products",
    title: "About our products",
    body: (
      <>
        <p>
          {site.name} specialises in pre-owned, vintage and thrift clothing. Since most of our
          products are pre-owned, individual items may show signs of previous wear, including minor
          fading, loose threads, stains, small imperfections or other signs of use. Unless a listing
          explicitly says &ldquo;New with tags&rdquo;, our products are pre-owned and are not sold
          as brand-new items.
        </p>
        <p>
          We make reasonable efforts to display each item&rsquo;s condition accurately through
          photographs and descriptions. Every piece is inspected and cleaned before listing, then
          described with a condition grade —{" "}
          {selectableConditions
            .map((c) => conditions[c])
            .map((c) => `${c.label} (${c.description.replace(/\.$/, "")})`)
            .join("; ")}
          . Please review all product images and descriptions carefully before purchasing. Each
          listing is also a single physical item: there are no other sizes or colours, and once it
          sells it&rsquo;s gone.
        </p>
      </>
    ),
  },
  {
    id: "descriptions-authenticity",
    title: "Product descriptions & authenticity",
    body: (
      <>
        <p>
          We aim to provide accurate product descriptions, photographs, brand information and
          condition details, including every flaw we find, in words and in photos. Colours may
          appear slightly different depending on your screen, lighting or device. For vintage and
          pre-owned clothing, tagged sizes may differ from modern sizing standards — please refer to
          the measurements in the listing rather than relying on the tagged size alone.
        </p>
        <p>
          We resell genuine branded goods that were first sold by or with the permission of the
          brand. Brand names are used only to describe the item: we are not affiliated with,
          endorsed by, or an authorised retailer of, any brand we stock, and all trademarks belong
          to their owners. We check every branded piece before listing it; if an item you bought
          from us turns out not to be genuine, we will take it back and refund you in full,
          including shipping.
        </p>
      </>
    ),
  },
  {
    id: "measurements-sizing",
    title: "Measurements & sizing",
    body: (
      <>
        <p>
          Measurements are taken manually and accurate to within{" "}
          {returnsPolicy.measurementToleranceCm} cm. Thrift sizing varies by brand and era, so
          please go by the listed measurements, not the tagged size, when deciding whether a piece
          will fit.
        </p>
        <p>
          You are responsible for checking the listed measurements before placing an order.
          We&rsquo;re not responsible for sizing preferences, fit expectations, or the difference
          between vintage and modern sizing, where the listed measurements were accurate — but if a
          piece measures more than {returnsPolicy.measurementToleranceCm} cm off from what was
          listed, that counts as not as described and is always returnable (see{" "}
          <Link href="/returns">Returns</Link>).
        </p>
      </>
    ),
  },
  {
    id: "no-returns",
    title: returnsPolicy.changeOfMind ? "Returns & exchanges" : "No return, no exchange policy",
    body: returnsPolicy.changeOfMind ? (
      <p>
        You can return a piece for any reason — including change of mind, size or fit — within{" "}
        {returnsPolicy.windowDays} days of delivery, as long as it&rsquo;s unworn (apart from trying
        it on), unwashed, unaltered, and returned with our tag still attached. Full detail, fees and
        how to request it: our{" "}
        <Link href="/returns">Returns, refunds &amp; cancellation policy</Link>.
      </p>
    ) : (
      <>
        <p>
          <strong>All sales are final.</strong> Due to the unique and limited nature of thrift and
          vintage clothing, we don&rsquo;t accept returns or exchanges for incorrect size selection
          or fit preferences, change of mind, colour preferences or minor variations in appearance,
          disagreement with a style that was accurately described, or minor signs of wear or
          imperfections that were disclosed in the listing. Please inspect the photographs,
          description, measurements and condition details before purchasing.
        </p>
        <p>
          Nothing in this policy excludes remedies required under applicable consumer protection
          law. If an item is materially different from its description, defective, or otherwise
          qualifies for a remedy under applicable law, <Link href="/contact">contact us</Link> for
          assistance. Full detail and how to request a remedy: our{" "}
          <Link href="/returns">Returns, refunds &amp; cancellation policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "payment-policy",
    title: "Payment policy",
    body: (
      <>
        <p>
          All orders must be prepaid using only the payment methods displayed and supported at
          checkout. Orders are processed after successful payment confirmation; an order
          confirmation does not guarantee dispatch if payment has not been successfully received or
          an order requires verification. Cash on delivery is not available.
        </p>
        <p>
          Online payments (UPI, debit and credit cards, netbanking and wallets where offered) are
          processed by Razorpay Software Private Limited, an RBI-authorised payment aggregator. Your
          card or bank details go straight to Razorpay; we never see or store them. We don&rsquo;t
          charge a fee for any payment method, though your bank may charge its own fees.
        </p>
        <p>
          If money leaves your account but the payment fails, it is reversed automatically within
          the time limits set by the Reserve Bank of India. If it hasn&rsquo;t arrived after that,
          contact us with your order number and we&rsquo;ll chase it with Razorpay. You may also
          raise a dispute (chargeback) with your bank or card issuer under its rules. Razorpay
          support: <a href="https://razorpay.com/support/">razorpay.com/support</a>.
        </p>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Order cancellation",
    body: (
      <>
        <p>
          Please review your order carefully before completing payment.{" "}
          <strong>Before dispatch</strong> (usually within {shippingPolicy.dispatchDays} business
          days of payment): you can cancel any order free of charge, for a full refund including
          shipping, from <Link href="/account/orders">Account → Orders</Link> or by{" "}
          <Link href="/contact?topic=cancellation">contacting us</Link>.{" "}
          <strong>After dispatch:</strong> the order can no longer be cancelled, but it can be
          returned once it arrives if it qualifies under our{" "}
          <Link href="/returns">Returns policy</Link>.
        </p>
        <p>
          We may also cancel an order ourselves — for example if the piece is found damaged before
          dispatch, was listed at an obviously wrong price, your pincode can&rsquo;t be served, or
          we suspect fraud — and will always tell you why and refund you in full. Nothing in this
          section limits any cancellation or refund right available under applicable law.
        </p>
      </>
    ),
  },
  {
    id: "shipping-delivery",
    title: "Shipping & delivery",
    body: (
      <>
        <p>
          We offer domestic shipping within India and international shipping to selected countries.
          Domestic dispatch and delivery timelines, and shipping charges, are covered in our{" "}
          <Link href="/shipping">Shipping policy</Link> (currently: dispatch within{" "}
          {shippingPolicy.dispatchDays} business days, delivery {shippingPolicy.deliveryDays}{" "}
          business days after that, {formatMoney(shipping.domesticPaise)} within India and{" "}
          {internationalShippingLabel} to other countries).
        </p>
        <p>
          Estimated delivery timelines are provided for guidance and may vary depending on the
          destination, courier service, customs clearance, weather, public holidays and other
          circumstances beyond our control — they are estimates, not guarantees, unless expressly
          confirmed in writing. You must provide a complete and accurate shipping address, contact
          number, postal code and any other information required for delivery; we aren&rsquo;t
          responsible for delays caused by incorrect or incomplete information, customs inspections,
          or circumstances beyond our reasonable control. If a parcel is delayed, lost or damaged in
          transit, <Link href="/contact">contact us</Link> so we can investigate with the carrier.
        </p>
      </>
    ),
  },
  {
    id: "international-orders",
    title: "International orders & customs duties",
    body: (
      <>
        <p>
          International orders may be subject to import duties, customs taxes, VAT, GST, brokerage
          fees or other charges imposed by the destination country. Unless explicitly stated
          otherwise at checkout, these charges are the buyer&rsquo;s responsibility. Please check
          the import regulations and potential charges applicable in your country before placing an
          order.
        </p>
        <p>
          Customs authorities may inspect, hold or delay shipments; such delays are outside our
          direct control. Customers must provide accurate information required for customs
          clearance. Any customs-related issue will be handled in accordance with applicable law and
          the shipping service&rsquo;s terms.
        </p>
      </>
    ),
  },
  {
    id: "undeliverable-parcels",
    title: "Undeliverable, refused & unclaimed parcels",
    body: (
      <p>
        You are responsible for providing accurate delivery information and being available to
        receive your order. If a shipment is returned because of an incorrect address, failure to
        collect the parcel, refusal to pay applicable import charges, or repeated unsuccessful
        delivery attempts, we will review the circumstances and the applicable courier terms before
        determining the next steps. Any additional shipping or return-to-origin charges, and any
        refund, will be handled in accordance with applicable law and the shipping provider&rsquo;s
        terms.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Product availability",
    body: (
      <>
        <p>
          Our products are generally unique or available in limited quantities. Adding a piece to
          your cart doesn&rsquo;t reserve it; when you start checkout, we hold the pieces in your
          cart for 15 minutes so nobody else can buy them while you pay. If the hold ends before you
          pay, the pieces become available to others again, so adding an item to your cart does not
          guarantee it will remain available until checkout is completed.
        </p>
        <p>
          Your order is accepted, and the contract formed, when we confirm your payment by email and
          on your order page. Very rarely, an inventory error means an item becomes unavailable
          after payment (for example, two payments for the same piece arriving at the same moment) —
          if that happens, we will contact you and arrange an appropriate resolution, including a
          refund for that piece.
        </p>
      </>
    ),
  },
  {
    id: "pricing-errors",
    title: "Pricing & errors",
    body: (
      <>
        <p>
          Prices are in Indian rupees and include all applicable Indian taxes. Visitors outside
          India see prices converted into their local currency as an estimate only; orders are
          charged in Indian rupees, or in US dollars for some international orders, as shown at
          checkout before you pay. The shipping charge, any coupon discount and the total are shown
          in your cart and at checkout before you pay. We don&rsquo;t add any other fees.
        </p>
        <p>
          We reserve the right to correct genuine pricing, listing or technical errors. If a piece
          is listed at an obviously wrong price because of a mistake and affects an order already
          placed, we will contact you to arrange an appropriate resolution — usually cancelling the
          order before it ships for a full refund.
        </p>
      </>
    ),
  },
  {
    id: "promotions",
    title: "Promotions & discount codes",
    body: (
      <ul>
        <li>One coupon per order. Each coupon can be used once per account.</li>
        <li>
          A coupon may have a minimum order value, an end date and a limited number of uses, all
          shown when you apply it.
        </li>
        <li>
          Unless expressly stated otherwise, discounts can&rsquo;t be combined with other promotions
          or applied retrospectively to completed purchases. Coupons have no cash value and
          can&rsquo;t be exchanged or transferred.
        </li>
        <li>
          If you return part of an order, the refund is the price you actually paid for that item
          after the discount.
        </li>
      </ul>
    ),
  },
  {
    id: "fair-use",
    title: "Using the site fairly",
    body: (
      <p>
        Please don&rsquo;t use bots, scripts or multiple accounts to hold or buy pieces, or to
        scrape listings; abuse holds, coupons, returns or refunds; interfere with the site&rsquo;s
        security or try to reach data that isn&rsquo;t yours; or use the site for anything unlawful
        or to harm other shoppers.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <p>
        All original website content — photographs, graphics, logos, branding and written
        descriptions created by {site.name} — is protected by applicable intellectual property laws,
        and may not be copied, reproduced, distributed or used commercially without prior
        permission, except as permitted by law. You&rsquo;re of course free to wear, gift or resell
        what you buy from us.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the extent permitted by applicable law, {site.name} isn&rsquo;t responsible for indirect
        or consequential losses arising from the use of our website, or for delays caused by
        circumstances beyond our reasonable control. Within what the law allows, our responsibility
        for an order is limited to the amount you paid for it. Nothing in these terms excludes or
        limits liability, or any consumer right, that cannot legally be excluded or limited under
        applicable law.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: (
      <p>
        We collect and use customer information to process orders, arrange deliveries, provide
        customer support and fulfil our legal obligations. Personal information is handled in
        accordance with our <Link href="/privacy">Privacy notice</Link> and applicable data
        protection laws — see that page for what we collect, how it&rsquo;s used, stored and
        protected, and your rights over it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The updated version is published on this page
        with a revised &ldquo;last updated&rdquo; date, and applies as permitted by applicable law.
        Orders already placed are handled under the terms and legal requirements that applied when
        you placed them.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India, subject to applicable consumer protection
        laws. Subject to your right to approach a consumer commission, the courts at{" "}
        {jurisdictionCity} have jurisdiction over any dispute. Nothing in these terms restricts any
        consumer right that cannot legally be waived.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact information",
    body: (
      <>
        <p>
          For questions about an order, product, payment, shipping or these terms, please{" "}
          <Link href="/contact">contact us</Link>. If something goes wrong, our Grievance Officer,{" "}
          {grievanceOfficer.name} ({grievanceOfficer.email}, {grievanceOfficer.phone}), acknowledges
          every complaint within {grievanceOfficer.acknowledgeWithinHours} hours and resolves it
          within {grievanceOfficer.resolveWithinDays} days.
        </p>
        <p>
          You can also contact the {externalRedress.consumerHelpline.label} on{" "}
          {externalRedress.consumerHelpline.phone} or at{" "}
          <a href={externalRedress.consumerHelpline.url}>consumerhelpline.gov.in</a>, or file a
          complaint with a consumer commission through{" "}
          <a href={externalRedress.eDaakhil.url}>e-Daakhil</a>. Thank you for shopping with{" "}
          {site.name}.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      updated={policyUpdated.terms}
      summary={
        <ul>
          <li>You must be 18 or older to buy.</li>
          <li>
            Every piece is one of one, pre-owned, graded, measured and photographed with its flaws.
          </li>
          <li>
            Prices include all taxes; shipping is shown before you pay. Cash on delivery isn&rsquo;t
            available.
          </li>
          <li>
            {returnsPolicy.changeOfMind
              ? `Changed your mind? Return unworn pieces within ${returnsPolicy.windowDays} days.`
              : "All sales are final — check photos, condition and measurements first."}{" "}
            Not as described or not genuine? Full refund, including shipping.
          </li>
          <li>Cancelling before dispatch is always free.</li>
        </ul>
      }
      sections={sections}
    />
  );
}
