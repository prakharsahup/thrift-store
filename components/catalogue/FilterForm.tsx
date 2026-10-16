"use client";

import { ChevronDown } from "lucide-react";
import Form from "next/form";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { defaultSort, type Filters } from "@/lib/catalogue/filters";
import { conditions } from "@/lib/config/conditions";
import type { Facets } from "@/lib/server/catalogue";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** The listing's path, e.g. "/c/men-jeans" or "/search". */
  action: string;
  filters: Filters;
  facets: Facets;
  /** Category checkboxes (search page only). */
  categoryOptions?: { slug: string; name: string }[];
  /** Keeps label ids unique when the form renders twice (sidebar + mobile sheet). */
  idPrefix: string;
  /** Desktop: apply as soon as a checkbox changes. Mobile: wait for "Show results". */
  autoSubmit?: boolean;
  onSubmitted?: () => void;
};

type Group = {
  name: "cat" | "size" | "condition" | "brand" | "style";
  title: string;
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
};

// A plain GET form: checkbox names repeat (?size=M&size=L), so it works without JavaScript, and
// next/form turns the submit into a client-side navigation when JS is available.
export function FilterForm({
  action,
  filters,
  facets,
  categoryOptions = [],
  idPrefix,
  autoSubmit = false,
  onSubmitted,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [min, setMin] = useState(filters.minRupees?.toString() ?? "");
  const [max, setMax] = useState(filters.maxRupees?.toString() ?? "");

  const groups: Group[] = [
    {
      name: "cat",
      title: "Category",
      options: categoryOptions.map((c) => ({ value: c.slug, label: c.name })),
      selected: filters.categories,
    },
    {
      name: "size",
      title: "Tagged size",
      options: facets.sizes.map((s) => ({ value: s, label: s })),
      selected: filters.sizes,
    },
    {
      name: "condition",
      title: "Condition",
      options: facets.conditions.map((c) => ({
        value: c,
        label: conditions[c].label,
        hint: conditions[c].description,
      })),
      selected: filters.conditions,
    },
    {
      name: "brand",
      title: "Brand",
      options: facets.brands.map((b) => ({ value: b, label: b })),
      selected: filters.brands,
    },
    {
      name: "style",
      title: "Style",
      options: facets.styles.map((s) => ({ value: s.tag, label: s.label })),
      selected: filters.styles,
    },
  ];

  return (
    <Form
      ref={formRef}
      action={action}
      scroll={false}
      onSubmit={() => onSubmitted?.()}
      onChange={(event) => {
        if (
          autoSubmit &&
          event.target instanceof HTMLInputElement &&
          event.target.type === "checkbox"
        ) {
          formRef.current?.requestSubmit();
        }
      }}
      className="space-y-1"
    >
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.sort !== defaultSort(filters.q) ? (
        <input type="hidden" name="sort" value={filters.sort} />
      ) : null}

      {groups
        .filter((group) => group.options.length > 0)
        .map((group) => (
          <details
            key={group.name}
            open={group.selected.length > 0 || group.name !== "brand"}
            className="group border-b border-border"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {group.title}
              <span className="flex items-center gap-2">
                {group.selected.length > 0 ? (
                  <span className="rounded-sm bg-surface px-1.5 text-xs">
                    {group.selected.length}
                  </span>
                ) : null}
                <ChevronDown
                  aria-hidden
                  className="size-4 transition-transform group-open:rotate-180"
                />
              </span>
            </summary>
            <fieldset className="pb-4">
              <legend className="sr-only">{group.title}</legend>
              <ul
                className={cn(
                  "space-y-2",
                  group.name === "size" && "grid grid-cols-3 gap-2 space-y-0",
                )}
              >
                {group.options.map((option) => {
                  const id = `${idPrefix}-${group.name}-${option.value}`.replace(/\s+/g, "-");
                  return (
                    <li key={option.value}>
                      <label
                        htmlFor={id}
                        title={option.hint}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 text-sm",
                          group.name === "size" &&
                            "justify-center rounded-md border border-border py-2 has-checked:border-fg has-checked:bg-fg has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:outline-primary",
                        )}
                      >
                        <input
                          id={id}
                          type="checkbox"
                          name={group.name}
                          value={option.value}
                          defaultChecked={group.selected.includes(option.value)}
                          className={cn(
                            "size-4 accent-primary",
                            group.name === "size" && "sr-only",
                          )}
                        />
                        {option.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </details>
        ))}

      {facets.priceRangeRupees ? (
        <fieldset className="border-b border-border py-3">
          <legend className="float-left mb-3 w-full text-sm font-semibold">Price (₹)</legend>
          <div className="clear-both flex items-center gap-2">
            <label htmlFor={`${idPrefix}-min`} className="sr-only">
              Minimum price in rupees
            </label>
            <Input
              id={`${idPrefix}-min`}
              // Empty inputs get no name, so they don't add "min=" to the URL.
              name={min ? "min" : undefined}
              type="number"
              inputMode="numeric"
              min={0}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder={String(facets.priceRangeRupees.min)}
            />
            <span aria-hidden className="text-muted">
              –
            </span>
            <label htmlFor={`${idPrefix}-max`} className="sr-only">
              Maximum price in rupees
            </label>
            <Input
              id={`${idPrefix}-max`}
              name={max ? "max" : undefined}
              type="number"
              inputMode="numeric"
              min={0}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder={String(facets.priceRangeRupees.max)}
            />
          </div>
        </fieldset>
      ) : null}

      <div className={cn("pt-4", !autoSubmit && "sticky bottom-0 bg-bg pb-4")}>
        <Button type="submit" variant={autoSubmit ? "outline" : "primary"} fullWidth>
          {autoSubmit ? "Apply price" : "Show results"}
        </Button>
      </div>
    </Form>
  );
}
