import Link from "next/link";
import { site } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

type Props = { className?: string };

// Text wordmark until the owner supplies a logo.
export function Logo({ className }: Props) {
  return (
    <Link
      href="/"
      className={cn(
        "shrink-0 font-display text-lg font-bold tracking-tight whitespace-nowrap lg:text-xl",
        className,
      )}
    >
      {site.name}
      <span className="sr-only">, home</span>
    </Link>
  );
}
