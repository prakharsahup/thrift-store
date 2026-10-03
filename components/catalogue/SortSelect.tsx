"use client";

import Form from "next/form";
import { Button } from "@/components/ui/Button";
import { inputVariants } from "@/components/ui/Input";
import { sortOptions, type Filters } from "@/lib/catalogue/filters";

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
    <Form action={action} scroll={false} className="flex min-w-0 items-center gap-2">
      {keep.map(([name, value], i) => (
        <input key={`${name}-${value}-${i}`} type="hidden" name={name} value={value} />
      ))}
      {/* Visually hidden on phones, where the toolbar has room for the select only. */}
      <label htmlFor="sort" className="sr-only text-sm text-muted sm:not-sr-only">
        Sort
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={filters.sort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={inputVariants({ fieldSize: "md", className: "w-auto pr-8 font-medium" })}
      >
        {sortOptions(filters.q).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <Button type="submit" variant="outline" size="sm">
          Sort
        </Button>
      </noscript>
    </Form>
  );
}
