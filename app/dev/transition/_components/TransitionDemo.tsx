import Link from "next/link";

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
        Click below: the blue panel should wipe upward and the page fade in, all in about 0.6s. A
        full reload shows no wipe. With &ldquo;Pause animations&rdquo; on, pages switch instantly.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={next.href}
          className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-fg"
        >
          {next.label}
        </Link>
        <Link
          href="/dev/motion#page-transition"
          className="inline-flex h-12 items-center rounded-md border border-fg px-6 text-sm font-semibold"
        >
          Back to the playground
        </Link>
      </div>
    </main>
  );
}
