import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  label: string;
  variant?: "primary" | "outline";
  className?: string;
};

// 8 copies = two identical halves, so translating by -50% loops seamlessly.
const COPIES = 8;

const variants = {
  primary: "bg-primary text-primary-fg",
  outline: "border border-fg text-fg",
} as const;

// CTA link whose label becomes a fast scrolling strip on hover / keyboard focus (MOTION.md §5.3).
// CSS only. The strip is aria-hidden, so the link's accessible name is the label, once.
// Touch devices (no hover) keep the static label.
export function HoverMarquee({ href, label, variant = "primary", className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "hover-marquee inline-flex h-12 items-center rounded-md text-sm font-semibold tracking-wide whitespace-nowrap uppercase",
        variants[variant],
        className,
      )}
    >
      <span className="hover-marquee-label">{label}</span>
      <span aria-hidden className="hover-marquee-track">
        {Array.from({ length: COPIES }, (_, i) => (
          <span key={i} className="hover-marquee-item">
            {label}
          </span>
        ))}
      </span>
    </Link>
  );
}
