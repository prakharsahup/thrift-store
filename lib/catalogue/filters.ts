import { conditions, type ProductCondition } from "@/lib/config/conditions";

// Listing filters live in the URL so every filtered view is shareable (CLAUDE.md §8).
// Multi-value filters are repeated params (?size=M&size=L), which is exactly what a plain GET form
// with checkboxes submits — so filtering works even without JavaScript. Comma lists are accepted
// too (?style=y2k,vintage) for hand-written links.

export const PAGE_SIZE = 24;
const MAX_PAGE = 20;
const MAX_VALUES = 20;

export const sorts = {
  relevance: "Best match",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
} as const;
export type SortKey = keyof typeof sorts;

/** Searches rank by best match; everything else lists newest first. */
export function defaultSort(q: string): SortKey {
  return q ? "relevance" : "newest";
}

/** The sorts that make sense for a listing ("Best match" needs a search query). */
export function sortOptions(q: string): [SortKey, string][] {
  return (Object.entries(sorts) as [SortKey, string][]).filter(
    ([key]) => key !== "relevance" || q !== "",
  );
}

export type Filters = {
  q: string;
  /** Category slugs (search page only; listing pages use the URL path). */
  categories: string[];
  sizes: string[];
  conditions: ProductCondition[];
  brands: string[];
  styles: string[];
  minRupees: number | null;
  maxRupees: number | null;
  sort: SortKey;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function values(raw: string | string[] | undefined, maxLength: number): string[] {
  const list = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= maxLength);
  return [...new Set(list)].slice(0, MAX_VALUES);
}

function wholeNumber(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{1,7}$/.test(value)) return null;
  return Number(value);
}

function isCondition(value: string): value is ProductCondition {
  return value in conditions;
}

function isSort(value: string | undefined): value is SortKey {
  return value !== undefined && value in sorts;
}

/** Parses and sanitises listing search params. Unknown or malformed values are dropped. */
export function parseFilters(raw: RawSearchParams): Filters {
  const sort = Array.isArray(raw.sort) ? raw.sort[0] : raw.sort;
  const page = wholeNumber(raw.page);
  const q = (Array.isArray(raw.q) ? raw.q[0] : raw.q)?.trim().slice(0, 100) ?? "";
  let minRupees = wholeNumber(raw.min);
  let maxRupees = wholeNumber(raw.max);
  if (minRupees !== null && maxRupees !== null && minRupees > maxRupees) {
    [minRupees, maxRupees] = [maxRupees, minRupees];
  }

  return {
    q,
    categories: values(raw.cat, 60).filter((v) => SLUG.test(v)),
    sizes: values(raw.size, 20),
    conditions: values(raw.condition, 20).filter(isCondition),
    brands: values(raw.brand, 80),
    styles: values(raw.style, 30)
      .map((v) => v.toLowerCase())
      .filter((v) => SLUG.test(v)),
    minRupees,
    maxRupees,
    sort: isSort(sort) && (sort !== "relevance" || q !== "") ? sort : defaultSort(q),
    page: page && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

/** Builds a listing URL for `pathname` with `filters` (defaults are left out to keep URLs short). */
export function filtersHref(pathname: string, filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  filters.categories.forEach((v) => params.append("cat", v));
  filters.sizes.forEach((v) => params.append("size", v));
  filters.conditions.forEach((v) => params.append("condition", v));
  filters.brands.forEach((v) => params.append("brand", v));
  filters.styles.forEach((v) => params.append("style", v));
  if (filters.minRupees !== null) params.set("min", String(filters.minRupees));
  if (filters.maxRupees !== null) params.set("max", String(filters.maxRupees));
  if (filters.sort !== defaultSort(filters.q)) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export type ActiveFilter = { key: string; label: string; href: string };

/**
 * One removable chip per active filter value, each linking to the same listing without it.
 * `labels` maps category slugs to names for the chips.
 */
export function activeFilters(
  pathname: string,
  filters: Filters,
  labels: { categories?: Record<string, string>; styles?: Record<string, string> } = {},
): ActiveFilter[] {
  const base: Filters = { ...filters, page: 1 };
  const chips: ActiveFilter[] = [];
  const without = <K extends "categories" | "sizes" | "conditions" | "brands" | "styles">(
    key: K,
    value: Filters[K][number],
  ) =>
    filtersHref(pathname, { ...base, [key]: (base[key] as string[]).filter((v) => v !== value) });

  base.categories.forEach((v) =>
    chips.push({
      key: `cat-${v}`,
      label: labels.categories?.[v] ?? v,
      href: without("categories", v),
    }),
  );
  base.sizes.forEach((v) =>
    chips.push({ key: `size-${v}`, label: `Size ${v}`, href: without("sizes", v) }),
  );
  base.conditions.forEach((v) =>
    chips.push({ key: `cond-${v}`, label: conditions[v].label, href: without("conditions", v) }),
  );
  base.brands.forEach((v) =>
    chips.push({ key: `brand-${v}`, label: v, href: without("brands", v) }),
  );
  base.styles.forEach((v) =>
    chips.push({ key: `style-${v}`, label: labels.styles?.[v] ?? v, href: without("styles", v) }),
  );
  if (base.minRupees !== null) {
    chips.push({
      key: "min",
      label: `From ₹${base.minRupees}`,
      href: filtersHref(pathname, { ...base, minRupees: null }),
    });
  }
  if (base.maxRupees !== null) {
    chips.push({
      key: "max",
      label: `Up to ₹${base.maxRupees}`,
      href: filtersHref(pathname, { ...base, maxRupees: null }),
    });
  }
  return chips;
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/** Orders tagged sizes the way shoppers expect: letter sizes, then numbers, then the rest. */
export function compareSizes(a: string, b: string): number {
  const rank = (s: string): [number, number, string] => {
    const letter = LETTER_SIZES.indexOf(s.toUpperCase());
    if (letter >= 0) return [0, letter, s];
    const number = Number.parseFloat(s);
    if (!Number.isNaN(number)) return [1, number, s];
    return [2, 0, s.toLowerCase()];
  };
  const [ga, na, sa] = rank(a);
  const [gb, nb, sb] = rank(b);
  return ga - gb || na - nb || sa.localeCompare(sb);
}
