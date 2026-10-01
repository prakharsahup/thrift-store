import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  /** "light" for controls on pale backgrounds, "dark" on ink. */
  tone?: "light" | "dark";
  children: React.ReactNode;
};

// Round icon button for carousel controls (prev / next / pause).
export function CarouselButton({
  label,
  onClick,
  disabled,
  pressed,
  tone = "light",
  children,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4",
        tone === "light"
          ? "border-border bg-bg text-fg hover:border-fg"
          : "border-bg/30 text-bg hover:border-bg",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
