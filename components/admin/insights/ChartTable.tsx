type Props = {
  caption: string;
  columns: string[];
  rows: string[][];
};

// The exact numbers behind a chart, folded away: for screen readers, keyboard users, and anyone
// who wants the figures rather than the shape.
export function ChartTable({ caption, columns, rows }: Props) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-accent">View as table</summary>
      <div className="mt-2 max-h-80 overflow-auto rounded-md border border-border">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-surface">
            <tr>
              {columns.map((c, i) => (
                <th key={c} scope="col" className={i ? "px-3 py-2 text-right" : "px-3 py-2"}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) =>
                  i ? (
                    <td key={i} className="px-3 py-1.5 text-right tabular-nums">
                      {cell}
                    </td>
                  ) : (
                    <th key={i} scope="row" className="px-3 py-1.5 font-normal">
                      {cell}
                    </th>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
