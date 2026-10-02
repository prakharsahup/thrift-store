import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Terms of service", robots: { index: false } };

// Placeholder until the owner supplies the real text (launch prep). Don't invent policy wording.
export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms of service"
      body="Our terms of service are being written and will be published before online checkout opens."
    />
  );
}
