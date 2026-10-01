"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { SearchSuggestion } from "@/lib/server/catalogue";
import { cn } from "@/lib/utils/cn";
import { formatINR } from "@/lib/utils/money";

type Props = { className?: string };

const DEBOUNCE_MS = 200;

function isSuggestionResponse(value: unknown): value is { results: SearchSuggestion[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { results?: unknown }).results)
  );
}

// Header search with instant results (CLAUDE.md §8), built as an ARIA combobox: type to see up to
// six matches, arrow keys to move, Enter to open one, Esc to close. Pressing Enter without picking
// a suggestion (or with no JS at all) submits to the full /search page.
export function HeaderSearch({ className }: Props) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<number | undefined>(undefined);
  const request = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  // Data is fetched from the input's change handler (debounced), not from an effect.
  function fetchSuggestions(text: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    fetch(`/api/search?q=${encodeURIComponent(text)}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<unknown>)
      .then((data) => {
        if (!isSuggestionResponse(data)) return;
        setResults(data.results);
        setActive(-1);
        setOpen(true);
      })
      .catch(() => {
        // Aborted by a newer keystroke, or offline: keep showing the previous results.
      });
  }

  function handleChange(value: string) {
    setQuery(value);
    window.clearTimeout(timer.current);
    if (value.trim().length < 2) {
      request.current?.abort();
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = window.setTimeout(() => fetchSuggestions(value.trim()), DEBOUNCE_MS);
  }

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  // Options: each suggestion, then "See all results".
  const optionCount = results.length + 1;
  const optionId = (i: number) => `${id}-option-${i}`;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => (a + 1) % optionCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => (a <= 0 ? optionCount - 1 : a - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (event.key === "Enter" && active >= 0 && active < results.length) {
      event.preventDefault();
      go(`/p/${results[active].slug}`);
    }
  }

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Form action="/search" role="search" onSubmit={() => setOpen(false)}>
        <label htmlFor={id} className="sr-only">
          Search
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          id={id}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Search brands, styles, pieces"
          autoComplete="off"
          className="h-10 w-full rounded-md border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-muted focus:border-fg"
        />
      </Form>

      {open ? (
        // preventDefault on mousedown keeps focus in the input. Otherwise Safari blurs the input
        // before the click lands, which closes the list and swallows the click.
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="absolute top-full right-0 z-40 mt-2 w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-border bg-bg p-2"
        >
          {results.length === 0 ? (
            <p role="status" className="px-2 py-3 text-sm text-muted">
              No pieces match &ldquo;{query.trim()}&rdquo;. Try a brand, style or colour.
            </p>
          ) : null}
          <ul id={listId} role="listbox" aria-label="Search suggestions">
            {results.map((result, i) => (
              <li key={result.slug} id={optionId(i)} role="option" aria-selected={i === active}>
                <Link
                  href={`/p/${result.slug}`}
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex items-center gap-3 rounded-md p-2",
                    i === active && "bg-surface",
                  )}
                >
                  <span className="relative block h-14 w-10 shrink-0 overflow-hidden rounded-sm bg-surface">
                    {result.imageUrl ? (
                      <Image
                        src={result.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{result.title}</span>
                    <span className="block text-xs text-muted">
                      {[result.brand, formatINR(result.pricePaise), result.sold ? "Sold" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            <li
              id={optionId(results.length)}
              role="option"
              aria-selected={active === results.length}
            >
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                tabIndex={-1}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActive(results.length)}
                className={cn(
                  "block rounded-md p-2 text-sm font-semibold text-primary",
                  active === results.length && "bg-surface",
                )}
              >
                See all results for &ldquo;{query.trim()}&rdquo;
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
