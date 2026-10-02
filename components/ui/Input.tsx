import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

// Text-like form fields (text, email, tel, number, search) and selects. 16px text everywhere, so
// iOS Safari never zooms the page when a field gets focus. Outlines use --color-input (3:1+).
const inputStyles = cva(
  [
    "w-full min-w-0 rounded-md border border-input text-base text-fg transition-colors",
    "placeholder:text-muted not-disabled:hover:border-fg focus-visible:border-fg",
    "aria-invalid:border-sale disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      fieldSize: {
        md: "h-11 px-3",
        lg: "h-12 px-4",
      },
      tone: {
        /** Paper fill: forms on the page background or on kraft sections. */
        default: "bg-bg",
        /** Kraft fill: search boxes in the header. */
        filled: "bg-surface",
      },
    },
    defaultVariants: { fieldSize: "md", tone: "default" },
  },
);

export type InputStyleProps = VariantProps<typeof inputStyles>;

/** Field classes, for a <select> or anything else that should match <Input>. */
export function inputVariants({
  className,
  ...options
}: InputStyleProps & { className?: string } = {}): string {
  return cn(inputStyles(options), className);
}

type Props = Omit<React.ComponentProps<"input">, "size"> & InputStyleProps;

export function Input({ fieldSize, tone, className, ...props }: Props) {
  return <input className={inputVariants({ fieldSize, tone, className })} {...props} />;
}
