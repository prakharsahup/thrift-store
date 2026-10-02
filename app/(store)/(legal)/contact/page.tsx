import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Contact us", robots: { index: false } };

// Placeholder until the owner supplies the real text (launch prep). Don't invent policy wording.
export default function ContactPage() {
  return (
    <ComingSoon
      title="Contact us"
      body="Our contact details page is on its way. Until then, you can reach us through the social links in the footer."
    />
  );
}
