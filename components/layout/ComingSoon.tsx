import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  /** Page name, e.g. "Returns & refunds". Shown in the breadcrumb and the heading. */
  title: string;
  /** One or two honest sentences about what's coming and when. */
  body: string;
  crumbs?: { label: string; href: string }[];
};

// Placeholder for routes that are linked from the site but not built yet (drops, legal pages,
// order history). It says so plainly instead of inventing content, and offers a way back to
// shopping. Replace the page that renders this when the real feature ships; the URL stays.
export function ComingSoon({ title, body, crumbs = [] }: Props) {
  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, ...crumbs, { label: title }]} />
      <div className="max-w-2xl py-12 md:py-20">
        <p className="inline-block -rotate-2 rounded-sm bg-accent px-2 py-1 text-xs font-bold tracking-wider text-accent-fg uppercase">
          Coming soon
        </p>
        <h1 className="mt-4 text-2xl font-bold md:text-3xl">{title}</h1>
        <p className="mt-4 max-w-prose text-base text-muted">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/search?sort=newest">Shop new arrivals</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
