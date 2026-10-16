import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GenderMenu } from "@/lib/server/catalogue";

type Props = { menu: GenderMenu };

// Panel for a Men / Women / Unisex tab: categories that have sub-categories get a column each
// (Jackets → Bomber, Leather…); the rest sit in a compact list underneath.
export function GenderPanel({ menu }: Props) {
  const withSubs = menu.groups.filter((g) => g.children.length > 0);
  const flat = menu.groups.filter((g) => g.children.length === 0);

  return (
    <nav aria-label={`${menu.name} categories`} className="site-container py-10">
      <Link
        href={menu.href}
        className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase hover:text-fg"
      >
        Shop all {menu.name.toLowerCase()} <ArrowRight aria-hidden className="size-4" />
      </Link>

      {withSubs.length > 0 ? (
        <ul className="mt-6 grid grid-cols-6 gap-x-6 gap-y-8">
          {withSubs.map((group) => (
            <li key={group.slug}>
              <Link href={group.href} className="font-display text-xl text-accent hover:text-fg">
                {group.name}
              </Link>
              <ul className="mt-4 space-y-2 border-l border-border pl-3">
                {group.children.map((child) => (
                  <li key={child.slug}>
                    <Link href={child.href} className="text-sm hover:text-accent hover:underline">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}

      {flat.length > 0 ? (
        <div className={withSubs.length > 0 ? "mt-8 border-t border-border pt-6" : "mt-6"}>
          {withSubs.length > 0 ? (
            <p className="mb-3 text-xs font-bold tracking-widest text-muted uppercase">
              More {menu.name.toLowerCase()}
            </p>
          ) : null}
          <ul className="columns-2 gap-x-6 sm:columns-4 lg:columns-6">
            {flat.map((group) => (
              <li key={group.slug} className="break-inside-avoid">
                <Link
                  href={group.href}
                  className="block py-1 text-sm font-semibold hover:text-accent hover:underline"
                >
                  {group.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
