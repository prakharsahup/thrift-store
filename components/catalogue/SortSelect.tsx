"use client";

import Form from "next/form";
import { sorts, type Filters, type SortKey } from "@/lib/catalogue/filters";

type Props = { action: string; filters: Filters };

// Sorting keeps every other filter (as hidden fields) and resets to the first page.
export function SortSelect({ action, filters }: Props) {
  const keep: [string, string][] = [
    ...(filters.q ? ([["q", filters.q]] as [string, string][]) : []),
    ...filters.categories.map((v): [string, string] => ["cat", v]),
    ...filters.sizes.map((v): [string, string] => ["size", v]),
    ...filters.conditions.map((v): [string, string] => ["condition", v]),
    ...filters.brands.map((v): [string, string] => ["brand", v]),
    ...filters.styles.map((v): [string, string] => ["style", v]),
    ...(filters.minRupees !== null
      ? ([["min", String(filters.minRupees)]] as [string, string][])
      : []),
    ...(filters.maxRupees !== null
      ? ([["max", String(filters.maxRupees)]] as [string, string][])
      : []),
  ];

  return (
    <Form action={action} scroll={false} className="flex items-center gap-2">
      {keep.map(([name, value], i) => (
        <input key={`${name}-${value}-${i}`} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="sort" className="text-sm text-muted">
        Sort
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={filters.sort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-10 rounded-md border border-border bg-bg px-2 text-sm font-medium"
      >
        {(Object.entries(sorts) as [SortKey, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 rounded-md border border-fg px-3 text-sm">
          Sort
        </button>
      </noscript>
    </Form>
  );
}
