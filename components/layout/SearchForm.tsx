import Form from "next/form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Unique per page — the header and the 404 page can both render a search form. */
  id: string;
  defaultValue?: string;
  className?: string;
};

// Plain GET form to /search: works without JS; next/form makes it a client navigation when JS loads.
// Used on the search and 404 pages; the header uses HeaderSearch, which adds instant results.
export function SearchForm({ id, defaultValue, className }: Props) {
  return (
    <Form action="/search" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
      />
      <Input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search brands, styles, pieces"
        autoComplete="off"
        tone="filled"
        className="pl-9"
      />
    </Form>
  );
}
