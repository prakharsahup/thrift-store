"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, Search, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useMobileMenu } from "./MobileMenuProvider";

const itemClass =
  "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted aria-[current=page]:text-fg";
const iconClass = "size-5";

// Fixed bottom bar below lg. "Categories" opens the same drawer as the header hamburger.
export function MobileNav() {
  const pathname = usePathname();
  const { open, show } = useMobileMenu();

  const current = (href: string, exact = false) =>
    (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`))
      ? "page"
      : undefined;

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        <li>
          <Link href="/" aria-current={current("/", true)} className={itemClass}>
            <House aria-hidden className={iconClass} />
            Home
          </Link>
        </li>
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={show}
            className={cn(itemClass, "w-full")}
          >
            <LayoutGrid aria-hidden className={iconClass} />
            Categories
          </button>
        </li>
        <li>
          <Link href="/search" aria-current={current("/search")} className={itemClass}>
            <Search aria-hidden className={iconClass} />
            Search
          </Link>
        </li>
        <li>
          <Link href="/wishlist" aria-current={current("/wishlist")} className={itemClass}>
            <Heart aria-hidden className={iconClass} />
            Wishlist
          </Link>
        </li>
        <li>
          <Link href="/account" aria-current={current("/account")} className={itemClass}>
            <User aria-hidden className={iconClass} />
            Account
          </Link>
        </li>
      </ul>
    </nav>
  );
}
