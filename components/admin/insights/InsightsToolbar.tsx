import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { InsightsContext } from "@/lib/server/insights";
import { cn } from "@/lib/utils/cn";
import { comparisonLabel, insightsHref, istToday, presetLabels } from "@/lib/utils/insights";
import { rangePresets } from "@/lib/validators/insights";

type Props = {
  ctx: Pick<InsightsContext, "range" | "demo" | "params">;
  /** The current page, so the links and the date form stay on it. */
  path: string;
  /** Params this page needs kept when the range changes (e.g. the breakdown dimension). */
  keep?: Record<string, string>;
};

// Range presets, a custom date range and the demo switch. Plain links and a GET form, so it works
// without JavaScript and every view has a shareable URL.
export function InsightsToolbar({ ctx, path, keep = {} }: Props) {
  const { range, demo, params } = ctx;
  const base = { ...params, ...keep };
  const today = istToday(new Date());

  return (
    <div className="space-y-4">
      {demo ? (
        <p
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-accent p-3 text-sm text-accent-fg"
        >
          <FlaskConical aria-hidden className="size-4 shrink-0" />
          <span className="font-semibold">Demo data.</span>
          <span>These numbers are generated from your real products, not real orders.</span>
          <Link href={insightsHref(path, base, { demo: null })} className="font-semibold underline">
            Show real numbers
          </Link>
        </p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted">
            <span className="font-semibold text-fg">{range.label}</span> · {comparisonLabel(range)}
          </p>
          <ul aria-label="Date range" className="mt-2 flex flex-wrap gap-2">
            {rangePresets
              .filter((p) => p !== "custom")
              .map((preset) => {
                const current = range.preset === preset;
                return (
                  <li key={preset}>
                    <Link
                      href={insightsHref(path, base, { range: preset, from: null, to: null })}
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "block rounded-md border px-3 py-1.5 text-sm font-semibold",
                        current
                          ? "border-fg bg-fg text-bg"
                          : "border-border text-fg hover:border-fg",
                      )}
                    >
                      {presetLabels[preset]}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>

        <form
          action={path}
          className="flex flex-wrap items-end gap-2"
          aria-label="Custom date range"
        >
          <input type="hidden" name="range" value="custom" />
          {demo ? <input type="hidden" name="demo" value="1" /> : null}
          {Object.entries(keep).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <div>
            <label htmlFor="insights-from" className="mb-1 block text-xs font-semibold">
              From
            </label>
            <Input
              id="insights-from"
              type="date"
              name="from"
              max={today}
              defaultValue={range.fromDate}
              className="w-40"
            />
          </div>
          <div>
            <label htmlFor="insights-to" className="mb-1 block text-xs font-semibold">
              To
            </label>
            <Input
              id="insights-to"
              type="date"
              name="to"
              max={today}
              defaultValue={range.toDate}
              className="w-40"
            />
          </div>
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>
      </div>

      {!demo ? (
        <p className="text-xs text-muted">
          No orders yet, or want to see how the pages work?{" "}
          <Link
            href={insightsHref(path, base, { demo: "1" })}
            className="font-semibold text-accent underline"
          >
            Preview with demo data
          </Link>
        </p>
      ) : null}
    </div>
  );
}
