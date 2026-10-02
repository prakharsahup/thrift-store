import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Shipping", robots: { index: false } };

// Placeholder until the owner supplies the real text (launch prep). Don't invent policy wording.
export default function ShippingPage() {
  return (
    <ComingSoon
      title="Shipping"
      body="Our full shipping policy is being written and will be here before online checkout opens."
    />
  );
}
