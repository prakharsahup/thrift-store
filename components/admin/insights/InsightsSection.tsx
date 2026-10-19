type Props = {
  id: string;
  title: string;
  /** One line under the title saying what the numbers mean. */
  description?: string;
  /** A link on the right, e.g. "All categories". */
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function InsightsSection({ id, title, description, action, children }: Props) {
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-lg border border-border p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-bold">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
        {action ? <div className="text-sm">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
