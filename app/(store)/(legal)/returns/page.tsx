import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { policyUpdated, returnsPolicy as r, shippingPolicy } from "@/lib/config/legal";
import { site } from "@/lib/config/site";
import { formatINR } from "@/lib/utils/money";

export const metadata: Metadata = {
  title: "Returns, refunds & cancellation",
  description: `How to cancel an order, return a piece and get a refund from ${site.name}.`,
  alternates: { canonical: "/returns" },
};

const fee = r.changeOfMindFeePaise > 0 ? formatINR(r.changeOfMindFeePaise) : null;

// TODO(owner): template policy. The windows and fees come from lib/config/legal.ts
// (returnsPolicy); "not as described" returns must stay, because E-Commerce Rules 2020 r. 6(6)
// requires them. Have a lawyer review the wording.
const sections: LegalSection[] = [
  {
    id: "one-of-one",
    title: "Why there are no exchanges",
    body: (
      <p>
        Every piece is one of one, so we can&rsquo;t swap it for another size or colour. Instead,
        you can return it for a refund as described below.
      </p>
    ),
  },
  {
    id: "cancel",
    title: "Cancelling an order",
    body: (
      <>
        <p>
          <strong>Before it ships:</strong> you can cancel any order, free of charge, until we hand
          it to the courier (usually within {shippingPolicy.dispatchDays} business days of payment).
          Use the &ldquo;Cancel or get help&rdquo; link on your order page, or{" "}
          <Link href="/contact?topic=cancellation">contact us</Link> with your order number. You get
          a full refund, including shipping.
        </p>
        <p>
          <strong>After it ships:</strong> it can no longer be cancelled, but you can return it once
          it arrives (see below).
        </p>
        <p>
          <strong>If we cancel:</strong> we may cancel an order if the piece is found damaged before
          dispatch, was listed at an obviously wrong price, your pincode can&rsquo;t be served, or
          we suspect fraud. We&rsquo;ll tell you why, and refund you in full.
        </p>
        <p>We never charge a cancellation fee.</p>
      </>
    ),
  },
  {
    id: "not-as-described",
    title: "Not as described? Always returnable",
    body: (
      <>
        <p>
          You can always return a piece for a full refund, including the shipping you paid, if
          within {r.windowDays} days of delivery you tell us that it:
        </p>
        <ul>
          <li>isn&rsquo;t the item you ordered;</li>
          <li>
            has damage or a flaw that wasn&rsquo;t in the listing&rsquo;s description or photos;
          </li>
          <li>
            measures more than {r.measurementToleranceCm} cm different from a listed measurement;
          </li>
          <li>isn&rsquo;t genuine;</li>
          <li>arrived damaged in transit.</li>
        </ul>
        <p>
          Send a few photos showing the problem. An unboxing video helps but isn&rsquo;t required.
          We arrange a free pickup.
        </p>
      </>
    ),
  },
  r.changeOfMind
    ? {
        id: "change-of-mind",
        title: "Changed your mind?",
        body: (
          <>
            <p>
              You can also return a piece for any other reason — it doesn&rsquo;t fit, it&rsquo;s
              not quite your style — within {r.windowDays} days of delivery, as long as it is:
            </p>
            <ul>
              <li>unworn (apart from trying it on), unwashed and unaltered;</li>
              <li>returned with our tag still attached.</li>
            </ul>
            <p>
              We refund the price you paid for the piece
              {fee ? `, minus ${fee} for the reverse pickup` : ", and the pickup is free"}. The
              original shipping charge isn&rsquo;t refunded for change-of-mind returns.
            </p>
          </>
        ),
      }
    : {
        id: "change-of-mind",
        title: "All sales are final",
        body: (
          <>
            <p>
              Because every piece is pre-owned, one of one, graded and measured, we don&rsquo;t
              accept returns or exchanges for:
            </p>
            <ul>
              <li>incorrect size selection or fit preferences;</li>
              <li>change of mind after placing an order;</li>
              <li>colour preferences or minor variations in appearance between screens;</li>
              <li>disagreement with a style or appearance that was accurately described;</li>
              <li>minor signs of wear or imperfections that were disclosed in the listing.</li>
            </ul>
            <p>
              Please check the photographs, condition grade, flaws and measurements before you buy,
              and ask us first if anything is unclear. This doesn&rsquo;t affect your right to
              return a piece that is not as described (above), or any other remedy a consumer
              protection law entitles you to.
            </p>
          </>
        ),
      },
  {
    id: "how",
    title: "How to return",
    body: (
      <ol>
        <li>
          Within {r.windowDays} days of delivery, open the order in{" "}
          <Link href="/account/orders">Account → Orders</Link> and choose &ldquo;Cancel or get
          help&rdquo;, or <Link href="/contact?topic=return">contact us</Link> with your order
          number and photos.
        </li>
        <li>We reply within one business day with pickup details.</li>
        <li>Pack the piece securely; the courier collects it from your address.</li>
        <li>
          We inspect it within {r.refundStartDays} business days of receiving it and start your
          refund the same day.
        </li>
      </ol>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <ul>
          <li>Refunds go back to the original payment method (UPI, card or bank account).</li>
          <li>
            We start a refund within {r.refundStartDays} business days of receiving a return, or
            straight away for a cancelled order. Banks usually take {r.bankDays} working days to
            show it.
          </li>
          <li>
            If a coupon was used, the refund is what you actually paid for the piece after the
            discount.
          </li>
          <li>
            If money left your account for a payment that failed, it is reversed automatically
            within the Reserve Bank of India&rsquo;s time limits.
          </li>
          <li>
            We&rsquo;ll email you when the refund is issued. If it hasn&rsquo;t arrived after{" "}
            {r.bankDays} working days, <Link href="/contact?topic=refund">tell us</Link> and
            we&rsquo;ll send you the bank reference.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "late",
    title: "Late deliveries",
    body: (
      <p>
        If your order hasn&rsquo;t arrived {shippingPolicy.lateAfterDays} business days after the
        delivery estimate in our <Link href="/shipping">Shipping policy</Link>, you can cancel it
        for a full refund, including shipping — unless the delay is caused by events outside
        anyone&rsquo;s control, such as natural disasters or government restrictions.
      </p>
    ),
  },
  {
    id: "help",
    title: "Need help?",
    body: (
      <p>
        <Link href="/contact">Contact us</Link> with your order number. If you&rsquo;re unhappy with
        how we&rsquo;ve handled a return or refund, you can escalate it to our Grievance Officer
        (details on the <Link href="/contact#grievance-officer">contact page</Link>).
      </p>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns, refunds & cancellation"
      updated={policyUpdated.returns}
      summary={
        <ul>
          <li>Cancel free of charge any time before your order ships.</li>
          <li>
            Not as described, damaged or not genuine? Return within {r.windowDays} days for a full
            refund, including shipping.
          </li>
          {r.changeOfMind ? (
            <li>
              Changed your mind? Return unworn pieces within {r.windowDays} days
              {fee ? ` (${fee} pickup fee)` : ""}.
            </li>
          ) : (
            <li>
              All sales are final — no returns for size, fit, colour or change of mind. Please check
              the measurements and photos before you buy.
            </li>
          )}
          <li>
            Refunds go back to your original payment method; banks take {r.bankDays} working days.
          </li>
        </ul>
      }
      sections={sections}
    />
  );
}
