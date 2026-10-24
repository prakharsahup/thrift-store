import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { business, formatAddress, grievanceOfficer, policyUpdated } from "@/lib/config/legal";
import { site } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `What personal data ${site.name} collects, why, who it's shared with, how long it's kept and how to use your rights under India's Digital Personal Data Protection Act.`,
  alternates: { canonical: "/privacy" },
};

// TODO(owner): template notice written for the Digital Personal Data Protection Act 2023, the
// DPDP Rules 2025 and the IT (Reasonable Security Practices…) Rules 2011. Keep the processor list
// and the cookie table in step with what the site actually uses, and have a lawyer review it.

const dataTable: [string, string, string][] = [
  [
    "Account",
    "Email address or mobile number; your name and phone number if you add them.",
    "To sign you in with a one-time code and to know which orders, addresses and wishlist are yours.",
  ],
  [
    "Delivery addresses",
    "Name, phone number, address, city, state and pincode.",
    "To deliver your order and let the courier reach you.",
  ],
  [
    "Orders",
    "What you bought, prices, coupon used, payment status, Razorpay payment and order IDs, payment method type (e.g. UPI). Never your card or bank details.",
    "To take payment, fulfil and track your order, handle returns and refunds, and keep the tax records the law requires.",
  ],
  ["Cart and wishlist", "The pieces you save.", "To keep your cart and wishlist across devices."],
  [
    "Messages",
    "What you send through our contact form or by email, and our replies.",
    "To answer questions and resolve complaints.",
  ],
  [
    "Technical",
    "IP address, browser and device type, pages requested and error reports.",
    "To keep the site secure, prevent fraud and abuse (for example rate limits), and fix problems.",
  ],
  [
    "Marketing (only if you opt in)",
    "Your email address and what you asked to hear about.",
    "To tell you about drops or a piece you're watching. You can unsubscribe at any time.",
  ],
];

const processors: [string, string][] = [
  ["Supabase", "database, sign-in and file storage"],
  ["Vercel", "website hosting"],
  ["Razorpay", "payments (receives the amount, your contact details and your payment details)"],
  ["Resend", "sending order, sign-in and support emails"],
  ["Our SMS provider", "sending sign-in codes by text, if you use a mobile number"],
  ["Courier partners", "delivering your order (name, phone number and address only)"],
];

const retention: [string, string][] = [
  ["Account, cart and wishlist", "Until you delete your account."],
  ["Saved addresses", "Until you delete them or your account."],
  [
    "Orders and receipts (including the delivery address used)",
    "8 years, because tax and accounting laws require us to keep these records. They are kept even if you delete your account.",
  ],
  ["Support messages and complaints", "3 years after they're resolved."],
  ["Unconfirmed email sign-ups", "7 days."],
  ["Security and access logs", "At least 1 year, as the DPDP Rules 2025 require, then deleted."],
];

const storage: [string, string, string][] = [
  ["sb-…-auth-token (cookie)", "Keeps you signed in.", "Essential"],
  ["cart (local storage)", "Remembers your cart while you're signed out.", "Essential"],
  ["motion (local storage)", "Remembers if you turned animations off.", "Preference"],
  [
    "geo_country (cookie)",
    "Your country, worked out from your IP address by our host, so prices show in your currency. Kept for 30 days.",
    "Essential",
  ],
  [
    "Razorpay cookies",
    "Set by Razorpay inside its payment window to process and secure payments.",
    "Essential",
  ],
];

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          {business.legalName}, trading as {site.name} (&ldquo;we&rdquo;), decides how and why your
          personal data is used, so we are the &ldquo;Data Fiduciary&rdquo; under the Digital
          Personal Data Protection Act, 2023 (DPDP Act). Our address is {formatAddress().join(", ")}
          .
        </p>
        <p>
          This notice explains, in plain language, what we collect, why, who we share it with, how
          long we keep it and how you can use your rights.
        </p>
      </>
    ),
  },
  {
    id: "what",
    title: "What we collect and why",
    body: (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Data
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  What exactly
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Why we need it
                </th>
              </tr>
            </thead>
            <tbody>
              {dataTable.map(([name, what, why]) => (
                <tr key={name} className="border-b border-border align-top">
                  <th scope="row" className="py-2 pr-4 font-semibold">
                    {name}
                  </th>
                  <td className="py-2 pr-4">{what}</td>
                  <td className="py-2">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We collect only what we need for these purposes. We don&rsquo;t sell your data, and we
          don&rsquo;t use it for automated decisions about you.
        </p>
      </>
    ),
  },
  {
    id: "basis",
    title: "Our grounds for using it",
    body: (
      <ul>
        <li>
          <strong>To sell to you</strong>: you give us your contact and delivery details so we can
          fulfil your order. The DPDP Act allows us to use data you voluntarily provide for that
          purpose (section 7(a)).
        </li>
        <li>
          <strong>Legal obligations</strong>: keeping tax and accounting records, and responding to
          lawful requests from authorities.
        </li>
        <li>
          <strong>Your consent</strong>: for anything else, such as marketing emails. You give it by
          a clear action (you tick or submit something yourself — never a pre-ticked box) and you
          can withdraw it as easily, by unsubscribing or writing to us. Withdrawing doesn&rsquo;t
          affect what we did before.
        </li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We use these service providers (&ldquo;Data Processors&rdquo;). They may use your data
          only to provide their service to us, under contract, and must keep it secure:
        </p>
        <ul>
          {processors.map(([name, purpose]) => (
            <li key={name}>
              <strong>{name}</strong> — {purpose}
            </li>
          ))}
        </ul>
        <p>
          We may also disclose data when the law requires it, for example to tax authorities or
          under a valid order from a court or government agency.
        </p>
        <p>
          Some of these providers store data on servers outside India. We transfer data abroad only
          as the DPDP Act allows, and never to a country the Government of India has restricted.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <ul>
          {retention.map(([what, how]) => (
            <li key={what}>
              <strong>{what}</strong>: {how}
            </li>
          ))}
        </ul>
        <p>
          When a period ends, we delete the data or anonymise it so it can&rsquo;t identify you.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the DPDP Act you can:</p>
        <ul>
          <li>
            <strong>Access</strong> a summary of your data and how we use it, and who we&rsquo;ve
            shared it with;
          </li>
          <li>
            <strong>Correct, complete or update</strong> it;
          </li>
          <li>
            <strong>Erase</strong> it, unless we must keep it by law (such as order records);
          </li>
          <li>
            <strong>Withdraw consent</strong> you&rsquo;ve given, for example to marketing;
          </li>
          <li>
            <strong>Nominate</strong> someone to exercise these rights if you die or can&rsquo;t act
            yourself;
          </li>
          <li>
            <strong>Complain</strong> to our Grievance Officer, and then to the Data Protection
            Board of India if you&rsquo;re not satisfied.
          </li>
        </ul>
        <p>
          Signed in, you can do most of this yourself under{" "}
          <Link href="/account/privacy">Account → Privacy &amp; data</Link>: download your data,
          edit your details and addresses, or delete your account. For anything else, use our{" "}
          <Link href="/contact?topic=privacy">contact form</Link> or email the Grievance Officer. We
          may need to confirm it&rsquo;s you, and we reply within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our shop is for adults: you must be 18 or older to create an account or buy. We don&rsquo;t
        knowingly collect data from children. If you believe a child has given us their data,
        contact us and we&rsquo;ll delete it.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar storage",
    body: (
      <>
        <p>
          We use only what the site needs to work. We don&rsquo;t use advertising cookies or
          cross-site trackers.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Name
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Purpose
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {storage.map(([name, purpose, type]) => (
                <tr key={name} className="border-b border-border align-top">
                  <th scope="row" className="py-2 pr-4 font-semibold">
                    {name}
                  </th>
                  <td className="py-2 pr-4">{purpose}</td>
                  <td className="py-2">{type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          If we add analytics or anything that isn&rsquo;t essential, we&rsquo;ll update this table
          first and ask for your consent where the law requires it.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Keeping it safe",
    body: (
      <>
        <p>
          All traffic is encrypted (HTTPS). Access to personal data is limited to the people who
          need it to run the shop, and our database enforces that each shopper can only read their
          own account, addresses and orders. Payment details are handled by Razorpay and never reach
          our servers.
        </p>
        <p>
          If a personal data breach affects you, we&rsquo;ll tell you and the Data Protection Board
          of India without delay, explaining what happened, the likely impact and what you can do.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this notice",
    body: (
      <p>
        We&rsquo;ll update the date at the top whenever this notice changes. If a change affects how
        we use data you&rsquo;ve already given us, we&rsquo;ll tell you by email first.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Grievance Officer and contact",
    body: (
      <>
        <p>
          For questions, requests or complaints about your personal data, contact our Grievance
          Officer:
        </p>
        <p>
          <strong>
            {grievanceOfficer.name}, {grievanceOfficer.designation}
          </strong>
          <br />
          {business.legalName}, {formatAddress().join(", ")}
          <br />
          Email: <a href={`mailto:${grievanceOfficer.email}`}>{grievanceOfficer.email}</a>
          <br />
          Phone: {grievanceOfficer.phone}
        </p>
        <p>
          We acknowledge every request within {grievanceOfficer.acknowledgeWithinHours} hours and
          resolve it within {grievanceOfficer.resolveWithinDays} days.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      updated={policyUpdated.privacy}
      summary={
        <ul>
          <li>We collect what we need to sign you in, deliver your order and support you.</li>
          <li>We never see or store your card or bank details — Razorpay handles payments.</li>
          <li>We don&rsquo;t sell your data or use advertising trackers.</li>
          <li>Marketing emails only if you opt in; unsubscribe any time.</li>
          <li>
            Download or delete your data any time from{" "}
            <Link href="/account/privacy" className="font-semibold underline">
              Account → Privacy &amp; data
            </Link>
            .
          </li>
        </ul>
      }
      sections={sections}
    />
  );
}
