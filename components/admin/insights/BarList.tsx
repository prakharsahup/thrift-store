import Link from "next/link";

type Item = {
  label: string;
  /** Sets the bar length. */
  value: number;
  /** What's printed, e.g. "₹12,400". */
  display: string;
  /** A second, quieter figure, e.g. "14 sold". */
  detail?: string;
  href?: string;
};

type Props = {
  items: Item[];
  /** Shown when there's nothing to list. */
  empty?: string;
};

// Ranked horizontal bars in plain HTML: label and figure stay as real text for every reader.
export function BarList({ items, empty = "Nothing in this range yet." }: Props) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {item.href ? (
              <Link href={item.href} className="min-w-0 truncate font-semibold hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate font-semibold">{item.label}</span>
            )}
            <span className="shrink-0 tabular-nums">
              {item.display}
              {item.detail ? <span className="ml-2 text-xs text-muted">{item.detail}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
