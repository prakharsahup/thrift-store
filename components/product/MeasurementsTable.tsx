import type { MeasurementKey, Measurements } from "@/lib/server/catalogue";

type Props = { measurements: Measurements; taggedSize: string | null };

const labels: Record<MeasurementKey, { label: string; hint: string }> = {
  chest: { label: "Chest", hint: "armpit to armpit" },
  shoulder: { label: "Shoulder", hint: "seam to seam" },
  sleeve: { label: "Sleeve", hint: "shoulder seam to cuff" },
  length: { label: "Length", hint: "top to hem" },
  waist: { label: "Waist", hint: "side to side" },
  hip: { label: "Hip", hint: "side to side, widest point" },
  inseam: { label: "Inseam", hint: "crotch to hem" },
};

// Thrift sizing is inconsistent, so flat measurements matter more than the label (CLAUDE.md §4).
export function MeasurementsTable({ measurements, taggedSize }: Props) {
  const rows = (Object.keys(labels) as MeasurementKey[]).flatMap((key) => {
    const value = measurements[key];
    return value ? [{ key, value, ...labels[key] }] : [];
  });

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        One size{taggedSize ? ` (tagged ${taggedSize})` : ""}. Ask us if you need a measurement.
      </p>
    );
  }

  return (
    <div>
      <table className="w-full text-sm">
        <caption className="sr-only">Flat measurements in centimetres</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-0">
              <th scope="row" className="py-2 text-left font-medium">
                {row.label} <span className="font-normal text-muted">· {row.hint}</span>
              </th>
              <td className="py-2 text-right tabular-nums">{row.value} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">
        Measured flat. Double chest, waist and hip for the full circumference, then compare with a
        piece you already own.
      </p>
    </div>
  );
}
