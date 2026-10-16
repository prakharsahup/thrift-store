import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DropCountdown } from "./DropCountdown";

type Props = {
  eyebrow: string;
  title: string;
  sticker: string;
  body?: string | null;
  /** Go-live time: shows the countdown boxes. */
  countdownTo?: string;
  primary: { href: string; label: string };
};

// Top of a drop page (Drop Night design): eyebrow, the drop name, a skewed date sticker, the
// countdown before go-live, and the call to action.
export function DropHero({ eyebrow, title, sticker, body, countdownTo, primary }: Props) {
  return (
    <section aria-labelledby="drop-hero" className="site-container pt-8 pb-14 md:pt-12 md:pb-20">
      <p className="text-xs font-bold tracking-widest text-accent uppercase">{eyebrow}</p>
      <h1 id="drop-hero" className="mt-2 max-w-5xl text-3xl text-accent md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 w-fit -rotate-2 bg-fg px-4 py-2 font-display text-base text-bg md:text-xl">
        {sticker}
      </p>
      {body ? <p className="mt-6 max-w-prose text-base text-muted">{body}</p> : null}

      <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        {countdownTo ? <DropCountdown target={countdownTo} /> : <span />}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href={primary.href} size="lg">
            {primary.label}
          </ButtonLink>
          <Link
            href="#how-claiming-works"
            className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-fg"
          >
            How claiming works
          </Link>
        </div>
      </div>
    </section>
  );
}
