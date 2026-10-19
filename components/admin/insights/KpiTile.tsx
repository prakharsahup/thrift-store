import { DeltaBadge } from "./DeltaBadge";

type Props = {
  label: string;
  value: string;
  /** Relative change vs the previous period; omit to hide the comparison. */
  change?: number | null;
  lowerIsBetter?: boolean;
  /** A short line under the value, e.g. "21% margin". */
  detail?: string;
};

export function KpiTile({ label, value, change, lowerIsBetter, detail }: Props) {
  return (
    <div className="h-full rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold break-words sm:text-xl lg:text-2xl">
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {change !== undefined ? <DeltaBadge change={change} lowerIsBetter={lowerIsBetter} /> : null}
        {detail ? <span className="text-xs text-muted">{detail}</span> : null}
      </div>
    </div>
  );
}
