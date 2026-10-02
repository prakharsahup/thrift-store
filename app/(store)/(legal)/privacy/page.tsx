import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Privacy policy", robots: { index: false } };

// Placeholder until the owner supplies the real text (launch prep). Don't invent policy wording.
export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy policy"
      body="Our privacy policy is being written and will be published before online checkout opens."
    />
  );
}
