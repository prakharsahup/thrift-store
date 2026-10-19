"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export const insightsTabs = [
  { href: "/admin/insights", label: "Overview" },
  { href: "/admin/insights/sales", label: "Sales" },
  { href: "/admin/insights/products", label: "What sells" },
  { href: "/admin/insights/inventory", label: "Stock" },
  { href: "/admin/insights/customers", label: "Customers" },
  { href: "/admin/insights/marketing", label: "Coupons & drops" },
  { href: "/admin/insights/fulfilment", label: "Fulfilment" },
] as const;

// Report tabs. Client-side only to read the current URL: each tab keeps the chosen range and
// demo mode, but drops params that belong to one page (sort order, breakdown dimension).
export function InsightsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const keep = new URLSearchParams();
  for (const key of ["range", "from", "to", "demo"]) {
    const value = searchParams.get(key);
    if (value) keep.set(key, value);
  }
  const query = keep.toString();

  return (
    <nav aria-label="Insights reports" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-border">
        {insightsTabs.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={query ? `${href}?${query}` : href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
                  current
                    ? "border-primary text-fg"
                    : "border-transparent text-muted hover:text-fg",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
