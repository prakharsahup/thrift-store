import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  /** "header" for the top bar and menu drawer; "footer" for the larger footer mark. */
  size?: "header" | "footer";
};

// The light logo file is the owner's mark recoloured to --color-fg for the dark theme (the
// original black version is public/brand/baaki-logo-dark.png). Width and height are the largest
// size it's shown at, so next/image only generates 1x and 2x copies of that.
const sizes = {
  header: { width: 98, height: 48, className: "h-10 w-auto lg:h-12" },
  footer: { width: 196, height: 96, className: "h-20 w-auto lg:h-24" },
} as const;

export function Logo({ className, size = "header" }: Props) {
  const s = sizes[size];
  return (
    <Link href="/" className={cn("inline-block shrink-0", className)}>
      <Image
        src="/brand/baaki-logo-light.png"
        alt={site.name}
        width={s.width}
        height={s.height}
        loading="eager"
        className={s.className}
      />
      <span className="sr-only">, home</span>
    </Link>
  );
}
