"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { accountLinks, brandLinks } from "@/lib/config/navigation";
import type { BrandLink, GenderMenu } from "@/lib/server/catalogue";
import { site } from "@/lib/config/site";
import { useMobileMenu } from "./MobileMenuProvider";

type Props = {
  genders: GenderMenu[];
  brands: BrandLink[];
};

const summaryClass =
  "flex w-full cursor-pointer list-none items-center justify-between px-4 py-4 font-display text-lg text-accent [&::-webkit-details-marker]:hidden";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="border-b border-border">
      {/* Native <details> accordions: keyboard accessible with no extra JS; the shared name keeps
          one open at a time. */}
      <details name="mobile-menu" className="group">
        <summary className={summaryClass}>
          {title}
          <ChevronDown aria-hidden className="size-5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-5">{children}</div>
      </details>
    </li>
  );
}

// Left drawer for phones and tablets, mirroring the desktop tabs: Men, Women, Unisex and Brand as
// accordions, then Drop, Archive, search and the account links.
export function MobileMenu({ genders, brands }: Props) {
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
          <span className="font-display text-lg text-accent">{site.name}</span>
          <Button variant="ghost" size="icon" onClick={close} autoFocus className="-mr-2">
            <X aria-hidden />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain">
          <ul>
            {genders.map((gender) => (
              <Section key={gender.slug} title={gender.name}>
                <Link
                  href={gender.href}
                  className="block py-2 text-sm font-semibold text-accent underline underline-offset-4"
                >
                  Shop all {gender.name.toLowerCase()}
                </Link>
                <ul className="mt-2 space-y-3">
                  {gender.groups.map((group) => (
                    <li key={group.slug}>
                      <Link href={group.href} className="block py-1 text-sm font-bold">
                        {group.name}
                      </Link>
                      {group.children.length > 0 ? (
                        <ul className="grid grid-cols-2 gap-x-4 border-l border-border pl-3">
                          {group.children.map((child) => (
                            <li key={child.slug}>
                              <Link href={child.href} className="block py-1.5 text-sm">
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ))}
            <Section title="Brand">
              <ul className="grid grid-cols-2 gap-x-4">
                {brands.map((brand) => (
                  <li key={brand.name}>
                    <Link href={brand.href} className="flex justify-between gap-2 py-2 text-sm">
                      <span className="truncate">{brand.name}</span>
                      <span className="text-muted tabular-nums">{brand.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
            <li className="border-b border-border">
              <Link href="/drops" className="block px-4 py-4 font-display text-lg text-accent">
                Drop
              </Link>
            </li>
            <li className="border-b border-border">
              <Link href="/archive" className="block px-4 py-4 font-display text-lg text-accent">
                Archive
              </Link>
            </li>
          </ul>

          <ul className="px-4 py-6">
            <li>
              <Link href="/search" className="block py-2 text-sm font-semibold">
                Search everything
              </Link>
            </li>
            {[...accountLinks, ...brandLinks].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-2 text-sm font-semibold">
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
