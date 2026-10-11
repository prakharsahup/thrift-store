import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { conditions } from "@/lib/config/conditions";
import {
  business,
  externalRedress,
  formatAddress,
  grievanceOfficer,
  jurisdictionCity,
  policyUpdated,
  returnsPolicy,
} from "@/lib/config/legal";
import { site } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms for buying pre-loved pieces from ${site.name}: eligibility, condition grades, prices, payments, cancellations and how disputes are handled.`,
  alternates: { canonical: "/terms" },
};

// TODO(owner): template wording for an Indian online thrift store. Have a lawyer review it before
// launch; the numbers come from lib/config/legal.ts.
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
        <p>
          We may update these terms. The version in force when you place an order applies to that
          order, and the date at the top of this page shows when it last changed.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can buy",
    body: (
      <>
        <p>
          You must be at least 18 years old and able to enter a binding contract under Indian law to
          create an account or buy. We deliver only to addresses in India.
        </p>
        <p>
          You sign in with a one-time code sent to your email or mobile number. Keep access to them
          secure, and give us accurate details: we use them to deliver your order and to contact you
          about it. We may suspend an account used for fraud, abuse of offers or anything that
          breaks these terms, and we will tell you why.
        </p>
      </>
    ),
  },
  {
    id: "pre-loved",
    title: "Pre-loved, one-of-one pieces",
    body: (
      <>
        <p>
          Everything we sell is second-hand unless its grade says &ldquo;New with tags&rdquo;. Each
          listing is a single physical item: there are no other sizes or colours, and once it sells
          it&rsquo;s gone.
        </p>
        <p>Every piece is inspected and cleaned before listing, then described with:</p>
        <ul>
          <li>
            a condition grade —{" "}
            {Object.values(conditions)
              .map((c) => `${c.label} (${c.description.replace(/\.$/, "")})`)
              .join("; ")}
            ;
          </li>
          <li>
            flat measurements in centimetres, accurate to within{" "}
            {returnsPolicy.measurementToleranceCm} cm. Thrift sizing varies by brand and era, so
            please go by the measurements rather than the tagged size;
          </li>
          <li>every flaw we find, in words and in photos;</li>
          <li>the country of origin printed on the label, where there is one.</li>
        </ul>
        <p>
          Colours can look slightly different on different screens. Pre-loved items don&rsquo;t
          carry a manufacturer&rsquo;s warranty. If a piece isn&rsquo;t as described, you are
          entitled to return it for a full refund (see the{" "}
          <Link href="/returns">Returns policy</Link>).
        </p>
      </>
    ),
  },
  {
    id: "brands",
    title: "Brands and authenticity",
    body: (
      <>
        <p>
          We resell genuine branded goods that were first sold by or with the permission of the
          brand. Brand names are used only to describe the item. We are not affiliated with,
          endorsed by or an authorised retailer of any brand we stock, and all trademarks belong to
          their owners.
        </p>
        <p>
          We check every branded piece before listing it. If an item you bought from us turns out
          not to be genuine, we will take it back and refund you in full, including shipping.
        </p>
      </>
    ),
  },
  {
    id: "prices",
    title: "Prices, taxes and “est. retail”",
    body: (
      <>
        <p>
          Prices are in Indian rupees and include all applicable taxes. The shipping charge, any
          coupon discount and the total are shown in your cart and at checkout before you pay. We
          don&rsquo;t add any other fees.
        </p>
        <p>
          Some listings show an &ldquo;est. retail&rdquo; price. It is our good-faith estimate of
          what the item cost new, taken from the original price tag where there is one, otherwise
          from the brand&rsquo;s published price for that item or a comparable new item. It is not
          an MRP, a past price of ours, or the price you&rsquo;d pay in a shop today.
        </p>
        <p>
          If a piece is listed at an obviously wrong price because of a mistake, we may cancel the
          order before it ships. You will get a full refund, and we&rsquo;ll tell you why.
        </p>
      </>
    ),
  },
  {
    id: "orders",
    title: "Holds and how an order is made",
    body: (
      <>
        <p>
          Adding a piece to your cart doesn&rsquo;t reserve it. When you start checkout, we hold the
          pieces in your cart for 15 minutes so nobody else can buy them while you pay. If the hold
          ends before you pay, the pieces go back on sale.
        </p>
        <p>
          Your order is accepted, and the contract formed, when we confirm your payment by email and
          on your order page. Very rarely, two payments for the same piece arrive at the same
          moment. If that happens, the shopper whose payment we received second gets a full refund
          for that piece, and we tell them straight away.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <>
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
        <p>Cash on delivery is not available at the moment.</p>
      </>
    ),
  },
  {
    id: "coupons",
    title: "Coupons",
    body: (
      <ul>
        <li>One coupon per order. Each coupon can be used once per account.</li>
        <li>
          A coupon may have a minimum order value, an end date and a limited number of uses, all
          shown when you apply it.
        </li>
        <li>Coupons have no cash value and can&rsquo;t be exchanged or transferred.</li>
        <li>
          If you return part of an order, the refund is the price you actually paid for that item
          after the discount.
        </li>
      </ul>
    ),
  },
  {
    id: "delivery",
    title: "Shipping, cancellations and returns",
    body: (
      <p>
        Delivery charges, dispatch times and tracking are covered in our{" "}
        <Link href="/shipping">Shipping policy</Link>. How to cancel, return a piece and get a
        refund is covered in our{" "}
        <Link href="/returns">Returns, refunds &amp; cancellation policy</Link>. We never charge for
        cancelling an order before it ships.
      </p>
    ),
  },
  {
    id: "use",
    title: "Using the site fairly",
    body: (
      <>
        <p>Please don&rsquo;t:</p>
        <ul>
          <li>
            use bots, scripts or multiple accounts to hold or buy pieces, or to scrape listings;
          </li>
          <li>abuse holds, coupons, returns or refunds;</li>
          <li>
            interfere with the site&rsquo;s security or try to reach data that isn&rsquo;t yours;
          </li>
          <li>use the site for anything unlawful or to harm other shoppers.</li>
        </ul>
        <p>
          You&rsquo;re free to wear, gift or resell what you buy. Our photos, text, logo and design
          belong to us; please don&rsquo;t copy them for commercial use without permission.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          Nothing in these terms takes away your rights under the Consumer Protection Act, 2019 or
          any other law that protects consumers.
        </p>
        <p>
          Within what the law allows, our responsibility for an order is limited to the amount you
          paid for it, and we aren&rsquo;t responsible for losses that weren&rsquo;t reasonably
          foreseeable. We aren&rsquo;t responsible for delays caused by events outside our control,
          such as natural disasters, strikes, government orders or courier network outages; if one
          affects your order, we&rsquo;ll tell you and you may cancel for a full refund.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    title: "Complaints, governing law and disputes",
    body: (
      <>
        <p>
          If something goes wrong, please <Link href="/contact">contact us</Link> first. Our
          Grievance Officer, {grievanceOfficer.name} ({grievanceOfficer.email},{" "}
          {grievanceOfficer.phone}), acknowledges every complaint within{" "}
          {grievanceOfficer.acknowledgeWithinHours} hours and resolves it within{" "}
          {grievanceOfficer.resolveWithinDays} days.
        </p>
        <p>
          You can also contact the {externalRedress.consumerHelpline.label} on{" "}
          {externalRedress.consumerHelpline.phone} or at{" "}
          <a href={externalRedress.consumerHelpline.url}>consumerhelpline.gov.in</a>, or file a
          complaint with a consumer commission through{" "}
          <a href={externalRedress.eDaakhil.url}>e-Daakhil</a>.
        </p>
        <p>
          These terms are governed by the laws of India. Subject to your right to approach a
          consumer commission, the courts at {jurisdictionCity} have jurisdiction over any dispute.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated={policyUpdated.terms}
      summary={
        <ul>
          <li>You must be 18 or older and in India to buy.</li>
          <li>Every piece is one of one, graded, measured and photographed with its flaws.</li>
          <li>Prices include all taxes; shipping is shown before you pay.</li>
          <li>Cancelling before dispatch is always free.</li>
          <li>Not as described or not genuine? Full refund, including shipping.</li>
        </ul>
      }
      sections={sections}
    />
  );
}
