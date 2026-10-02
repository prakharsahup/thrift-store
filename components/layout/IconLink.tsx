import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  href: string;
  /** Accessible name — the icon itself is decorative. */
  label: string;
  className?: string;
  children: React.ReactNode;
};

export function IconLink({ href, label, className, children }: Props) {
  return (
    <ButtonLink href={href} variant="ghost" size="icon" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </ButtonLink>
  );
}
