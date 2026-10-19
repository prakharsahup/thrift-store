import { ChartTable } from "./ChartTable";
import { niceMax } from "@/lib/utils/insights";

type Props = {
  caption: string;
  labels: string[];
  values: number[];
  /** Name of the value, for the table and hover text, e.g. "Orders". */
  valueLabel: string;
  format?: (value: number) => string;
};

// Server-rendered column chart, one column per bucket. Same frame as LineChart.
export function ColumnChart({
  caption,
  labels,
  values,
  valueLabel,
  format = (v) => v.toLocaleString("en-IN"),
}: Props) {
  const count = labels.length;
  const max = niceMax(Math.max(0, ...values));
  const slot = count ? 100 / count : 100;
  const edges = count > 1 ? [0, Math.floor((count - 1) / 2), count - 1] : [0];

  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="relative h-36 pl-10 md:h-44" aria-hidden>
        {[max, max / 2, 0].map((tick, i) => (
          <div
            key={i}
            className="absolute right-0 left-10 border-t border-border"
            style={{ top: `${i * 50}%` }}
          >
            <span className="absolute -top-2 -left-10 w-8 text-right text-xs text-muted tabular-nums">
              {format(Math.round(tick))}
            </span>
          </div>
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-y-0 right-0 left-10 h-full w-[calc(100%-2.5rem)] text-accent"
        >
          {values.map((v, i) => {
            const height = (Math.max(0, v) / max) * 100;
            return (
              <rect
                key={labels[i]}
                x={i * slot + slot * 0.15}
                y={100 - height}
                width={slot * 0.7}
                height={height}
                fill="currentColor"
              >
                <title>{`${labels[i]}\n${valueLabel}: ${format(v)}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <div className="relative mt-2 ml-10 h-4 text-xs text-muted" aria-hidden>
        {edges.map((i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
            style={{ left: `${count > 1 ? (i / (count - 1)) * 100 : 0}%` }}
          >
            {labels[i]}
          </span>
        ))}
      </div>
      <ChartTable
        caption={caption}
        columns={["", valueLabel]}
        rows={labels.map((label, i) => [label, format(values[i] ?? 0)])}
      />
    </figure>
  );
}
