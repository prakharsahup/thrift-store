import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

type Props = {
  href: string;
  label: string;
  variant?: "primary" | "outline";
  className?: string;
};

// 8 copies = two identical halves, so translating by -50% loops seamlessly.
const COPIES = 8;

// CTA link (styled by the shared Button classes) whose label becomes a fast scrolling strip on hover / keyboard focus (MOTION.md §5.3).
// CSS only. The strip is aria-hidden, so the link's accessible name is the label, once.
// Touch devices (no hover) keep the static label.
export function HoverMarquee({ href, label, variant = "primary", className }: Props) {
  return (
    <Link
      href={href}
      className={buttonVariants({
        variant,
        size: "lg",
        className: className ? `hover-marquee ${className}` : "hover-marquee",
      })}
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
