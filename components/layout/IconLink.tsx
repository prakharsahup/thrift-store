import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  /** Accessible name — the icon itself is decorative. */
  label: string;
  className?: string;
  children: React.ReactNode;
};

export function IconLink({ href, label, className, children }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md hover:bg-surface [&_svg]:size-5",
        className,
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}
