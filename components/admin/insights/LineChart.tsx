import { ChartTable } from "./ChartTable";
import { cn } from "@/lib/utils/cn";
import { niceMax } from "@/lib/utils/insights";

const tones = {
  primary: "text-primary",
  accent: "text-accent",
  muted: "text-muted",
} as const;

type Series = {
  label: string;
  values: number[];
  tone: keyof typeof tones;
  /** Dashed, e.g. the previous period. */
  dashed?: boolean;
  /** Shade the area under the line. */
  area?: boolean;
};

type Props = {
  /** Read out before the table, e.g. "Revenue per day, last 30 days". */
  caption: string;
  /** One x label per point. */
  labels: string[];
  series: Series[];
  /** Formats axis ticks and table cells. */
  format: (value: number) => string;
  /** Formats the y axis when it needs to be shorter than `format`, e.g. "₹12K". */
  formatAxis?: (value: number) => string;
};

/** Up to five evenly spaced label positions, always including both ends. */
function tickIndexes(count: number): number[] {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i);
  return [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (count - 1))))];
}

// Server-rendered line chart. The plot is an SVG stretched to its box (strokes keep their width),
// and the axis labels are HTML so they stay readable at any width. Hovering a column shows its
// values; "View as table" lists them all.
export function LineChart({ caption, labels, series, format, formatAxis = format }: Props) {
  const count = labels.length;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => (count <= 1 ? 50 : (i / (count - 1)) * 100);
  const y = (v: number) => 100 - (Math.max(0, v) / max) * 100;
  const points = (values: number[]) =>
    count === 1
      ? `0,${y(values[0] ?? 0)} 100,${y(values[0] ?? 0)}`
      : values.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden>
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block w-4 border-t-2",
                tones[s.tone],
                s.dashed ? "border-dashed" : "border-solid",
              )}
              style={{ borderColor: "currentColor" }}
            />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="relative h-48 pl-14 md:h-64" aria-hidden>
        {[max, max / 2, 0].map((tick, i) => (
          <div
            key={i}
            className="absolute right-0 left-14 border-t border-border"
            style={{ top: `${i * 50}%` }}
          >
            <span className="absolute -top-2 -left-14 w-12 text-right text-xs text-muted tabular-nums">
              {formatAxis(tick)}
            </span>
          </div>
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-y-0 right-0 left-14 h-full w-[calc(100%-3.5rem)] overflow-visible"
        >
          {series.map((s) => (
            <g key={s.label} className={tones[s.tone]}>
              {s.area && count > 1 ? (
                <polygon
                  points={`0,100 ${points(s.values)} 100,100`}
                  fill="currentColor"
                  opacity={0.15}
                />
              ) : null}
              <polyline
                points={points(s.values)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
          {labels.map((label, i) => (
            <rect
              key={label}
              x={count <= 1 ? 0 : x(i) - 50 / (count - 1)}
              y={0}
              width={count <= 1 ? 100 : 100 / (count - 1)}
              height={100}
              fill="transparent"
            >
              <title>
                {[label, ...series.map((s) => `${s.label}: ${format(s.values[i] ?? 0)}`)].join(
                  "\n",
                )}
              </title>
            </rect>
          ))}
        </svg>
      </div>

      <div className="relative mt-2 ml-14 h-4 text-xs text-muted" aria-hidden>
        {tickIndexes(count).map((i) => (
          <span
            key={i}
            className={cn(
              "absolute whitespace-nowrap",
              i === 0 ? "left-0" : i === count - 1 ? "right-0" : "-translate-x-1/2",
            )}
            style={i === 0 || i === count - 1 ? undefined : { left: `${x(i)}%` }}
          >
            {labels[i]}
          </span>
        ))}
      </div>

      <ChartTable
        caption={caption}
        columns={["", ...series.map((s) => s.label)]}
        rows={labels.map((label, i) => [label, ...series.map((s) => format(s.values[i] ?? 0))])}
      />
    </figure>
  );
}
