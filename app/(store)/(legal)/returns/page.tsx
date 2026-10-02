import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Returns & refunds", robots: { index: false } };

// Placeholder until the owner supplies the real text (launch prep). Don't invent policy wording.
export default function ReturnsPage() {
  return (
    <ComingSoon
      title="Returns & refunds"
      body="Our returns and refunds policy is being written and will be here before online checkout opens."
    />
  );
}
