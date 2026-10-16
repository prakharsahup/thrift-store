"use client";

import { usePathname } from "next/navigation";

type Props = {
  /** Path prefixes where the children are not rendered, e.g. "/drops/". */
  prefixes: readonly string[];
  children: React.ReactNode;
};

// Lets server-rendered chrome skip a block on pages that already show it (the footer's drop alert
// on a drop page, which has its own sign-up for that drop).
export function HideOnPaths({ prefixes, children }: Props) {
  const pathname = usePathname();
  return prefixes.some((p) => pathname.startsWith(p)) ? null : children;
}
