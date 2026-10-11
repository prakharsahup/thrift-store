import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils/cn";

export type ListRow = {
  key: string;
  href: string;
  title: string;
  meta?: string;
  /** Badges etc. on the right. */
  aside?: React.ReactNode;
};

type Props = {
  title: string;
  /** Singular noun for buttons, e.g. "drop". */
  noun: string;
  basePath: string;
  rows: ListRow[];
  /** The key of the row being edited (highlighted). */
  selected: string | null;
  /** The editor for the selected row or a new one, or null when nothing is open. */
  editor: React.ReactNode;
  editorTitle?: string;
  notice?: string | null;
  emptyText: string;
};

// List on the left, editor on the right (stacked on phones), driven by ?edit=<key> or ?new=1.
export function ListEditor({
  title,
  noun,
  basePath,
  rows,
  selected,
  editor,
  editorTitle,
  notice,
  emptyText,
}: Props) {
  return (
    <>
      <PageHeader
        title={title}
        actions={<ButtonLink href={`${basePath}?new=1`}>New {noun}</ButtonLink>}
      >
        {notice ? (
          <p role="status" className="mt-4 rounded-md bg-surface p-3 text-sm">
            {notice}
          </p>
        ) : null}
      </PageHeader>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border p-8 text-center text-muted xl:self-start">
            {emptyText}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border xl:self-start">
            {rows.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  aria-current={row.key === selected ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 hover:bg-surface",
                    row.key === selected && "bg-surface",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{row.title}</span>
                    {row.meta ? (
                      <span className="block truncate text-sm text-muted">{row.meta}</span>
                    ) : null}
                  </span>
                  {row.aside ? (
                    <span className="flex shrink-0 flex-wrap justify-end gap-2">{row.aside}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {editor ? (
          <section
            aria-labelledby="editor-title"
            className="rounded-lg border border-border p-4 md:p-6 xl:self-start"
          >
            <h2 id="editor-title" className="mb-6 text-lg font-bold">
              {editorTitle}
            </h2>
            {editor}
          </section>
        ) : null}
      </div>
    </>
  );
}

/** Reads ?edit / ?new / ?created / ?deleted from page search params. */
export function editorParams(params: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return {
    edit: one(params.edit),
    isNew: one(params.new) === "1",
    notice: one(params.created) ? "Created." : one(params.deleted) ? "Deleted." : null,
  };
}
