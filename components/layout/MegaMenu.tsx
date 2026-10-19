"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { genderFromPath, type GenderNav, type NavLink } from "@/lib/config/navigation";
import type { BrandLink } from "@/lib/server/catalogue";
import { cn } from "@/lib/utils/cn";
import { BrandMenuPanel } from "./BrandMenuPanel";
import { MegaMenuPanel } from "./MegaMenuPanel";

type Props = {
  items: readonly GenderNav[];
  /** Top brands for the Brand tab, which sits after the gender tabs. */
  brands?: readonly BrandLink[];
  /** Plain links after the gender tabs (Lookbook, About). */
  links?: readonly NavLink[];
};

// Hover intent: a short delay before opening stops the panel flashing when the mouse just passes
// over the tabs, and a delay before closing forgives a slightly wobbly path into the panel.
const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 160;

// Which panel is open: a gender, or "brand".
type MenuKey = string;

const toggleId = (key: MenuKey) => `mega-toggle-${key}`;
const panelId = (key: MenuKey) => `mega-panel-${key}`;

const tabClass = cn(
  "relative flex h-full items-center px-3 text-sm font-semibold tracking-wide uppercase",
  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-fg after:transition-transform",
);

// Desktop gender tabs. Mouse users open a panel by hovering; keyboard and touch users use the
// chevron button next to each tab (a disclosure). The tab itself always links to the gender page.
export function MegaMenu({ items, brands, links = [] }: Props) {
  const pathname = usePathname();
  const section = genderFromPath(pathname);
  const [open, setOpen] = useState<MenuKey | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function setOpenAfter(next: MenuKey | null, delay: number) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  }

  function setOpenNow(next: MenuKey | null) {
    window.clearTimeout(timer.current);
    setOpen(next);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;
    const key = open;
    setOpenNow(null);
    document.getElementById(toggleId(key))?.focus();
  }

  return (
    <nav aria-label="Main" className="h-full" onKeyDown={handleKeyDown}>
      <ul className="flex h-full">
        {items.map((item) => {
          const isOpen = open === item.gender;
          return (
            <li
              key={item.gender}
              className="flex h-full items-center"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") {
                  setOpenAfter(item.gender, open ? 0 : OPEN_DELAY_MS);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setOpenAfter(null, CLOSE_DELAY_MS);
              }}
              onBlur={(event) => {
                if (isOpen && !event.currentTarget.contains(event.relatedTarget)) setOpenNow(null);
              }}
            >
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                data-active={section === item.gender || isOpen}
                onClick={() => setOpenNow(null)}
                className={cn(tabClass, "data-[active=true]:after:scale-x-100")}
              >
                {item.label}
              </Link>
              <button
                type="button"
                id={toggleId(item.gender)}
                aria-expanded={isOpen}
                aria-controls={panelId(item.gender)}
                onClick={() => setOpenNow(isOpen ? null : item.gender)}
                className="-ml-2 inline-flex size-6 items-center justify-center rounded-sm text-muted hover:text-fg"
              >
                <ChevronDown
                  aria-hidden
                  className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                />
                <span className="sr-only">{item.label} categories</span>
              </button>
              <MegaMenuPanel
                id={panelId(item.gender)}
                item={item}
                open={isOpen}
                onNavigate={() => setOpenNow(null)}
              />
            </li>
          );
        })}
        {brands ? (
          <li
            className="flex h-full items-center"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setOpenAfter("brand", open ? 0 : OPEN_DELAY_MS);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") setOpenAfter(null, CLOSE_DELAY_MS);
            }}
            onBlur={(event) => {
              if (open === "brand" && !event.currentTarget.contains(event.relatedTarget)) {
                setOpenNow(null);
              }
            }}
          >
            {/* No brand index page, so the whole tab is the disclosure button. */}
            <button
              type="button"
              id={toggleId("brand")}
              aria-expanded={open === "brand"}
              aria-controls={panelId("brand")}
              data-active={open === "brand"}
              onClick={() => setOpenNow(open === "brand" ? null : "brand")}
              className={cn(tabClass, "gap-1 data-[active=true]:after:scale-x-100")}
            >
              Brand
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-4 text-muted transition-transform",
                  open === "brand" && "rotate-180",
                )}
              />
            </button>
            <BrandMenuPanel
              id={panelId("brand")}
              brands={brands}
              open={open === "brand"}
              onNavigate={() => setOpenNow(null)}
            />
          </li>
        ) : null}
        {links.map((link) => (
          <li key={link.href} className="flex h-full items-center">
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                tabClass,
                "hover:after:scale-x-100 aria-[current=page]:after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
