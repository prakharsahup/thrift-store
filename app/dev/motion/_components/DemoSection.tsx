type Props = {
  id: string;
  title: string;
  /** MOTION.md section number, e.g. "5.4". */
  spec?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export function DemoSection({ id, title, spec, description, children }: Props) {
  return (
    <section aria-labelledby={id} className="site-container border-t border-border py-12">
      <h2 id={id} className="text-xl font-bold">
        {title}{" "}
        {spec ? <span className="font-mono text-sm text-muted">MOTION.md §{spec}</span> : null}
      </h2>
      {description ? (
        <div className="mt-2 max-w-prose text-sm text-muted">{description}</div>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}
