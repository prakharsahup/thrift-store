import Link from "next/link";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { RevealText } from "@/components/motion/RevealText";
import { cn } from "@/lib/utils/cn";

type Props = {
  id: string;
  title: string;
  eyebrow?: string;
  action?: { href: string; label: string };
  className?: string;
};

// Section title that reveals on scroll, with an optional "view all" link (a HoverMarquee on larger
// screens, a plain text link on phones where hover doesn't exist).
export function SectionHeading({ id, title, eyebrow, action, className }: Props) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-6", className)}>
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <RevealText as="h2" id={id} className="text-2xl font-bold md:text-3xl">
          {title}
        </RevealText>
      </div>
      {action ? (
        <>
          <HoverMarquee
            href={action.href}
            label={action.label}
            variant="outline"
            className="hidden h-10 shrink-0 sm:inline-flex"
          />
          <Link
            href={action.href}
            className="shrink-0 text-sm font-semibold text-primary underline sm:hidden"
          >
            {action.label}
          </Link>
        </>
      ) : null}
    </div>
  );
}
