import { formatMoney } from "@/lib/utils/money";

type Cell = { dow: number; hour: number; orders: number; revenue_paise: number };

type Props = { cells: Cell[] };

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const levels = ["bg-surface", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

function hourLabel(hour: number): string {
  const h = hour % 12 || 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

// Orders by weekday and hour (India time). The grid is a picture; the busiest slots are also
// listed as text underneath.
export function Heatmap({ cells }: Props) {
  const byKey = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c]));
  const max = Math.max(1, ...cells.map((c) => c.orders));
  const busiest = [...cells]
    .sort((a, b) => b.orders - a.orders || b.revenue_paise - a.revenue_paise)
    .slice(0, 3);

  if (!cells.length) return <p className="text-sm text-muted">No orders in this range yet.</p>;

  return (
    <div>
      <div
        aria-hidden
        className="grid grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] gap-0.5 text-xs text-muted"
      >
        {days.map((day, d) => (
          <div key={day} className="contents">
            <span className="self-center">{day}</span>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = byKey.get(`${d + 1}-${hour}`);
              const level = cell ? Math.ceil((cell.orders / max) * 4) : 0;
              return (
                <span
                  key={hour}
                  title={`${day} ${hourLabel(hour)}: ${cell?.orders ?? 0} orders`}
                  className={`h-4 rounded-[2px] md:h-5 ${levels[level]}`}
                />
              );
            })}
          </div>
        ))}
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className="text-center">
            {hour % 6 === 0 ? hourLabel(hour) : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted" aria-hidden>
        Fewer
        {levels.map((l) => (
          <span key={l} className={`size-3 rounded-[2px] ${l}`} />
        ))}
        More
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold">Busiest times: </span>
        {busiest
          .map(
            (c) =>
              `${days[c.dow - 1]} ${hourLabel(c.hour)} (${c.orders} orders, ${formatMoney(c.revenue_paise)})`,
          )
          .join(" · ")}
      </p>
    </div>
  );
}
