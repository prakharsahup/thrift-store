import { Button } from "./Button";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  /** "light" for controls on pale backgrounds, "dark" on ink. */
  tone?: "light" | "dark";
  children: React.ReactNode;
};

// Round icon button for carousel controls (prev / next / pause), built on Button.
export function CarouselButton({
  label,
  onClick,
  disabled,
  pressed,
  tone = "light",
  children,
}: Props) {
  return (
    <Button
      variant="ghost"
      size="icon"
      shape="round"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={
        tone === "light"
          ? "border border-input bg-bg [&_svg]:size-4"
          : "border border-bg/40 text-bg not-disabled:hover:bg-bg not-disabled:hover:text-fg [&_svg]:size-4"
      }
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
