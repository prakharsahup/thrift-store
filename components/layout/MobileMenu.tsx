"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { accountLinks, brandLinks, genderNav } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";
import { useMobileMenu } from "./MobileMenuProvider";

// Left drawer for phones and tablets. Each gender is a native <details> accordion (keyboard
// accessible with no extra JS); sharing a `name` keeps only one open at a time.
export function MobileMenu() {
  const { open, close } = useMobileMenu();

  return (
    <Sheet open={open} onClose={close} label="Menu">
      {/* Close the drawer when any link inside it is followed. */}
      <div
        className="flex h-full flex-col"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) close();
        }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="font-display text-lg font-bold">{site.name}</span>
          <Button variant="ghost" size="icon" onClick={close} autoFocus className="-mr-2">
            <X aria-hidden />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain">
          {genderNav.map((item) => (
            <details
              key={item.gender}
              name="mobile-menu-gender"
              className="group border-b border-border"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-display text-lg font-bold uppercase [&::-webkit-details-marker]:hidden">
                {item.label}
                <ChevronDown
                  aria-hidden
                  className="size-5 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="space-y-6 px-4 pb-6">
                <Link
                  href={item.href}
                  className="block text-sm font-semibold text-primary underline"
                >
                  Shop all {item.label.toLowerCase()}
                </Link>
                {item.columns.map((column) => {
                  const headingId = `mobile-${item.gender}-${column.title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
                  return (
                    <div key={column.title}>
                      <p
                        id={headingId}
                        className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase"
                      >
                        {column.title}
                      </p>
                      <ul aria-labelledby={headingId} className="grid grid-cols-2 gap-x-4">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <Link href={link.href} className="block py-2 text-sm">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}

          <ul className="px-4 py-4">
            {[...brandLinks, ...accountLinks].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-2 text-sm font-medium">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Sheet>
  );
}
