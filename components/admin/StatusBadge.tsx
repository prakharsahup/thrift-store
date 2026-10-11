import { cn } from "@/lib/utils/cn";

const tones = {
  neutral: "bg-surface text-fg",
  good: "bg-accent text-accent-fg",
  warn: "bg-fg text-bg",
  muted: "bg-sold text-fg",
  bad: "bg-sale text-primary-fg",
} as const;

type Props = { label: string; tone?: keyof typeof tones };

export function StatusBadge({ label, tone = "neutral" }: Props) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}

export const productStatusBadge = {
  draft: { label: "Draft", tone: "neutral" },
  available: { label: "Available", tone: "good" },
  reserved: { label: "On hold", tone: "warn" },
  sold: { label: "Sold", tone: "muted" },
} as const satisfies Record<string, Props>;

export const orderStatusBadge = {
  pending: { label: "Awaiting payment", tone: "neutral" },
  paid: { label: "Paid — to pack", tone: "warn" },
  packed: { label: "Packed", tone: "warn" },
  shipped: { label: "Shipped", tone: "good" },
  delivered: { label: "Delivered", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "muted" },
  refunded: { label: "Refunded", tone: "muted" },
} as const satisfies Record<string, Props>;
