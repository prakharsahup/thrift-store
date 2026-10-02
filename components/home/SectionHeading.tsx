import { ArrowRight } from "lucide-react";
import { RevealText } from "@/components/motion/RevealText";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils/cn";

type Props = {
  id: string;
  title: string;
  /**
   * "ruled": title, then a hairline running to the edge (or to the action).
   * "sticker": title with a tilted volt sticker beside it, e.g. "Fresh this week".
   */
  variant: "ruled" | "sticker";
  sticker?: string;
  action?: { href: string; label: string };
  className?: string;
};

// Section title that reveals on scroll, with an optional "view all" link (a HoverMarquee on larger
// screens, a plain text link on phones where hover doesn't exist). Home sections deliberately use
// different heading treatments; this covers the two that share a title-plus-action row.
export function SectionHeading({ id, title, variant, sticker, action, className }: Props) {
  return (
    <div className={cn("mb-8 flex items-center gap-4 md:gap-6", className)}>
      <RevealText as="h2" id={id} className="text-2xl font-bold md:text-3xl">
        {title}
      </RevealText>
      {variant === "sticker" && sticker ? (
        <span className="hidden shrink-0 -rotate-3 rounded-sm bg-accent px-2 py-1 text-xs font-bold tracking-wider text-accent-fg uppercase sm:inline-block">
          {sticker}
        </span>
      ) : null}
      <span
        aria-hidden
        className={cn("h-px flex-1", variant === "ruled" ? "bg-fg" : "bg-transparent")}
      />
      {action ? (
        <ButtonLink href={action.href} variant="link">
          {action.label} <ArrowRight aria-hidden />
        </ButtonLink>
      ) : null}
    </div>
  );
}
