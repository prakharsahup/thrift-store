import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { formatPolicyDate } from "@/lib/config/legal";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

type Props = {
  title: string;
  /** ISO date the wording last changed (lib/config/legal.ts → policyUpdated). */
  updated?: string;
  /** A plain-language summary shown above the full text. */
  summary?: React.ReactNode;
  sections: LegalSection[];
};

// Shared layout for the policy pages: breadcrumb, title, last-updated date, a short summary, a
// table of contents (a sticky sidebar from lg up) and numbered sections with linkable ids.
export function LegalPage({ title, updated, summary, sections }: Props) {
  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {updated ? (
          <p className="mt-2 text-sm text-muted">
            Last updated <time dateTime={updated}>{formatPolicyDate(updated)}</time>
          </p>
        ) : null}
        {summary ? (
          <div className="mt-6 rounded-lg bg-surface p-4 text-sm leading-relaxed md:p-6 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
            {summary}
          </div>
        ) : null}
      </header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <nav aria-labelledby="legal-toc" className="lg:sticky lg:top-28 lg:self-start">
          <h2
            id="legal-toc"
            className="mb-3 font-body text-xs font-semibold tracking-wider text-muted uppercase"
          >
            On this page
          </h2>
          <ol className="space-y-2 text-sm">
            {sections.map((section, i) => (
              <li key={section.id}>
                <Link href={`#${section.id}`} className="hover:text-primary hover:underline">
                  {i + 1}. {section.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-prose space-y-10">
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-28"
            >
              <h2 id={`${section.id}-heading`} className="text-lg font-bold md:text-xl">
                {i + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed md:text-base [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_h3]:mt-5 [&_h3]:font-body [&_h3]:font-bold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
