import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// The one chip style for category, style and tag links: square-cornered like the rest of the
// Drop Night design. `aria-current="page"` marks the
// selected chip (e.g. the current category on a PLP), so state comes from the markup.
const chipStyles = cva(
  [
    "inline-flex items-center rounded-sm border whitespace-nowrap transition-colors duration-150",
    "border-border font-semibold hover:border-accent hover:text-accent",
    "aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type Props = React.ComponentProps<typeof Link> & VariantProps<typeof chipStyles>;

export function ChipLink({ size, className, ...props }: Props) {
  return <Link className={cn(chipStyles({ size }), className)} {...props} />;
}
