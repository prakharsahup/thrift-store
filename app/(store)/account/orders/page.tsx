import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

// Placeholder until checkout (and with it, order history) is built.
export default function OrdersPage() {
  return (
    <ComingSoon
      title="Orders"
      body="Order history and tracking arrive with online checkout. Nothing to show here yet."
      crumbs={[{ label: "Account", href: "/account" }]}
    />
  );
}
