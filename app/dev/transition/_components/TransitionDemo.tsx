import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  title: string;
  next: { href: string; label: string };
};

export function TransitionDemo({ title, next }: Props) {
  return (
    <main className="site-container py-16">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">
        PageTransition · MOTION.md §5.9
      </p>
      <h1 className="mt-3 text-3xl font-bold md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-prose text-sm text-muted">
        Click below: the chilli panel should wipe upward and the page fade in, all in about 0.6s. A
        full reload shows no wipe. With &ldquo;Pause animations&rdquo; on, pages switch instantly.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={next.href} size="lg">
          {next.label}
        </ButtonLink>
        <ButtonLink href="/dev/motion#page-transition" variant="outline" size="lg">
          Back to the playground
        </ButtonLink>
      </div>
    </main>
  );
}
