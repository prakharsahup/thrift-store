import Link from "next/link";
import { site } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

type Props = { className?: string };

// Bungee wordmark in lavender (Drop Night design) until the owner supplies a logo.
export function Logo({ className }: Props) {
  return (
    <Link
      href="/"
      className={cn(
        "shrink-0 font-display text-lg whitespace-nowrap text-accent hover:text-fg lg:text-xl",
        className,
      )}
    >
      {site.name}
      <span className="sr-only">, home</span>
    </Link>
  );
}
