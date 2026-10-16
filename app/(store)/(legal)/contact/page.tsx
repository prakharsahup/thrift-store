import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BusinessDetails } from "@/components/legal/BusinessDetails";
import { ContactForm } from "@/components/legal/ContactForm";
import { externalRedress, grievanceOfficer } from "@/lib/config/legal";
import { shortOrderId } from "@/lib/config/orders";
import { site } from "@/lib/config/site";
import { getUser } from "@/lib/server/auth";
import { isSupportTopic } from "@/lib/validators/support";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get help with an order, a return or your data, or raise a complaint with ${site.name}'s Grievance Officer.`,
  alternates: { canonical: "/contact" },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Contact and grievance redressal (E-Commerce Rules 2020 r. 4(2), 4(4)–(5); DPDP Act s. 8(10)).
// ?topic= and ?order= (an order id) prefill the form, e.g. from an order page.
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const params = await searchParams;
  const topic = first(params.topic);
  const orderId = first(params.order);

  const { supabase, user } = await getUser();
  let name = "";
  let phone = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    name = profile?.full_name ?? "";
    phone = profile?.phone ?? user.phone ?? "";
  }

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact us" }]} />
      <h1 className="mt-4 text-2xl font-bold md:text-3xl">Contact us</h1>
      <p className="mt-2 max-w-prose text-muted">
        Questions about an order, a return, a refund or your data — or a complaint — all start here.
        Every message gets a ticket number by email straight away, and we reply within one business
        day.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
        <section aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="mb-6 text-xl font-bold">
            Send us a message
          </h2>
          <ContactForm
            defaults={{
              name,
              email: user?.email ?? "",
              phone: phone.replace(/^\+91/, ""),
              topic: isSupportTopic(topic) ? topic : "",
              orderRef: orderId && z.uuid().safeParse(orderId).success ? shortOrderId(orderId) : "",
            }}
          />
        </section>

        <div className="space-y-10">
          <section aria-labelledby="contact-details-heading">
            <h2 id="contact-details-heading" className="mb-4 text-xl font-bold">
              Who we are
            </h2>
            <BusinessDetails withGrievanceOfficer />
          </section>

          <section
            aria-labelledby="grievance-heading"
            className="rounded-lg bg-surface p-5 text-sm"
          >
            <h2 id="grievance-heading" className="font-display text-lg font-bold">
              Complaints and grievances
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Send a message with the topic &ldquo;A complaint&rdquo;, or email our Grievance
                Officer at{" "}
                <a href={`mailto:${grievanceOfficer.email}`} className="font-semibold underline">
                  {grievanceOfficer.email}
                </a>
                .
              </li>
              <li>
                You get a ticket number within {grievanceOfficer.acknowledgeWithinHours} hours (by
                email, usually instantly).
              </li>
              <li>
                We resolve it within {grievanceOfficer.resolveWithinDays} days and tell you what we
                did.
              </li>
              <li>
                Still not satisfied? Contact the {externalRedress.consumerHelpline.label} on{" "}
                <strong>{externalRedress.consumerHelpline.phone}</strong> or at{" "}
                <a href={externalRedress.consumerHelpline.url} className="font-semibold underline">
                  consumerhelpline.gov.in
                </a>
                , or file with a consumer commission via{" "}
                <a href={externalRedress.eDaakhil.url} className="font-semibold underline">
                  e-Daakhil
                </a>
                . For personal-data complaints, you may approach the Data Protection Board of India.
              </li>
            </ol>
          </section>

          <section aria-labelledby="contact-quick-heading">
            <h2 id="contact-quick-heading" className="mb-3 text-xl font-bold">
              Quick answers
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shipping" className="font-semibold underline hover:text-accent">
                  Shipping policy
                </Link>{" "}
                — costs, dispatch times and tracking.
              </li>
              <li>
                <Link href="/returns" className="font-semibold underline hover:text-accent">
                  Returns, refunds &amp; cancellation
                </Link>{" "}
                — how to cancel or send something back.
              </li>
              <li>
                <Link href="/account/orders" className="font-semibold underline hover:text-accent">
                  Your orders
                </Link>{" "}
                — status and tracking links.
              </li>
              <li>
                <Link href="/account/privacy" className="font-semibold underline hover:text-accent">
                  Privacy &amp; data
                </Link>{" "}
                — download or delete your data.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
