import type { Metadata } from "next";
import { CartContents } from "@/components/cart/CartContents";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

// Full cart page (the drawer is the primary cart UI). The cart lives in the browser / account, so
// this page is a static shell and the contents render on the client.
export default function CartPage() {
  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mt-4 text-2xl font-bold md:text-3xl">Your cart</h1>
      <div className="mt-6 max-w-2xl rounded-lg border border-border">
        <CartContents variant="page" />
      </div>
    </div>
  );
}
