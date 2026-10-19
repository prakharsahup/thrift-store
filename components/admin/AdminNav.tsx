"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ChartLine,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Package,
  Receipt,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const adminLinks = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/orders", label: "Orders", Icon: Receipt },
  { href: "/admin/insights", label: "Insights", Icon: ChartLine },
  { href: "/admin/messages", label: "Messages", Icon: Inbox },
  { href: "/admin/drops", label: "Drops", Icon: CalendarClock },
  { href: "/admin/categories", label: "Categories", Icon: FolderTree },
  { href: "/admin/banners", label: "Banners", Icon: ImageIcon },
  { href: "/admin/coupons", label: "Coupons", Icon: TicketPercent },
] as const;

// Admin section links: a horizontal scroller on phones, a sidebar column from lg up.
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {adminLinks.map(({ href, label, Icon }) => {
          const current = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap",
                  current ? "bg-fg text-bg" : "text-fg hover:bg-surface",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
