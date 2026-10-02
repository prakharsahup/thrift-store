import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// The one button style for the whole site (links that look like buttons use ButtonLink, which
// shares these classes). Focus rings come from the global :focus-visible rule in globals.css, so
// they switch to volt automatically inside `surface-dark` sections.
const buttonStyles = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none",
    "font-semibold tracking-wide uppercase transition-colors duration-150",
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        /** Chilli fill: the main action on a page or form. */
        primary:
          "bg-primary text-primary-fg disabled:bg-border disabled:text-muted not-disabled:hover:bg-fg not-disabled:hover:text-bg",
        /** Ink fill: strong secondary action, e.g. "Sign up" in the footer. */
        secondary:
          "bg-fg text-bg disabled:bg-border disabled:text-muted not-disabled:hover:bg-primary not-disabled:hover:text-primary-fg",
        /** Outlined: secondary actions next to a primary one. */
        outline:
          "border-2 border-fg text-fg disabled:opacity-50 not-disabled:hover:bg-fg not-disabled:hover:text-bg",
        /** Quiet: icon buttons in headers and drawers. */
        ghost: "text-fg disabled:opacity-50 not-disabled:hover:bg-surface",
        /** Paper fill for buttons that sit on photos or dark sections. */
        overlay: "bg-bg/90 text-fg shadow-sm disabled:opacity-50 not-disabled:hover:bg-bg",
        /** Looks like a text link, behaves like a button. */
        link: "h-auto px-0 tracking-normal normal-case text-primary underline underline-offset-4 disabled:opacity-50 not-disabled:hover:text-fg",
        /** Unavailable product ("Sold" / "On hold"): stays readable while disabled. */
        sold: "bg-sold text-fg",
      },
      size: {
        sm: "h-9 gap-1.5 px-3 text-xs [&_svg]:size-4",
        md: "h-11 gap-2 px-5 text-sm [&_svg]:size-4",
        lg: "h-12 gap-2 px-6 text-sm [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
      shape: {
        rounded: "rounded-md",
        round: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0 text-sm" }],
    defaultVariants: { variant: "primary", size: "md", shape: "rounded" },
  },
);

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;

/** Button classes, for elements that must look like a button but aren't one (see ButtonLink). */
export function buttonVariants({
  className,
  ...options
}: ButtonStyleProps & { className?: string } = {}): string {
  // cn (tailwind-merge) lets later classes win, e.g. the link variant's `h-auto` over a size's `h-11`.
  return cn(buttonStyles(options), className);
}

type Props = React.ComponentProps<"button"> & ButtonStyleProps;

export function Button({
  variant,
  size,
  shape,
  fullWidth,
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, shape, fullWidth, className })}
      {...props}
    />
  );
}
