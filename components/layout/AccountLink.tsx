"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart";
import { cn } from "@/lib/utils/cn";

type Props = { className?: string };

// "Log in" for guests, "Account" once signed in. The session is only known in the browser (pages
// stay cacheable), so the label fades in once CartSync has resolved it instead of flickering.
export function AccountLink({ className }: Props) {
  const ready = useCartStore((s) => s.ready);
  const signedIn = useCartStore((s) => s.mode === "account");

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className={cn(
        "transition-opacity duration-200",
        ready ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {signedIn ? "Account" : "Log in"}
    </Link>
  );
}
