import type { Metadata } from "next";
import { formatINR } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Design tokens" };

// Class names are written out in full so Tailwind can detect them.
const colors = [
  { token: "--color-bg", swatch: "bg-bg", note: "Page background" },
  { token: "--color-fg", swatch: "bg-fg", note: "Primary text" },
  { token: "--color-muted", swatch: "bg-muted", note: "Secondary text" },
  { token: "--color-surface", swatch: "bg-surface", note: "Section / card fill" },
  { token: "--color-primary", swatch: "bg-primary", note: "Brand accent, CTAs" },
  { token: "--color-primary-fg", swatch: "bg-primary-fg", note: "Text on primary" },
  { token: "--color-accent", swatch: "bg-accent", note: "Badges, highlights" },
  { token: "--color-accent-fg", swatch: "bg-accent-fg", note: "Text on accent" },
  { token: "--color-sale", swatch: "bg-sale", note: "Savings, errors" },
  { token: "--color-sold", swatch: "bg-sold", note: "SOLD badge fill" },
  { token: "--color-border", swatch: "bg-border", note: "Dividers, inputs" },
  { token: "--color-overlay", swatch: "bg-overlay", note: "Drawer / modal scrim" },
] as const;

const typeScale = [
  { cls: "text-4xl", px: 64 },
  { cls: "text-3xl", px: 48 },
  { cls: "text-2xl", px: 32 },
  { cls: "text-xl", px: 24 },
  { cls: "text-lg", px: 18 },
  { cls: "text-base", px: 16 },
  { cls: "text-sm", px: 14 },
  { cls: "text-xs", px: 12 },
] as const;

const radii = [
  { cls: "rounded-sm", label: "--radius-sm · 4px" },
  { cls: "rounded-md", label: "--radius-md · 8px" },
  { cls: "rounded-lg", label: "--radius-lg · 16px" },
] as const;

const spacing = [1, 2, 3, 4, 6, 8, 12, 16] as const;
const spacingWidth: Record<(typeof spacing)[number], string> = {
  1: "w-1",
  2: "w-2",
  3: "w-3",
  4: "w-4",
  6: "w-6",
  8: "w-8",
  12: "w-12",
  16: "w-16",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-10">
      <h2 className="mb-6 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="site-container pb-24 pt-10">
      <h1 className="text-2xl font-bold md:text-3xl">Design tokens</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Everything here comes from <code>@theme</code> in <code>app/globals.css</code>. Change a
        value there and the whole site follows.
      </p>

      <Section title="Colour">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map((c) => (
            <li key={c.token} className="overflow-hidden rounded-md border border-border">
              <div className={`h-20 ${c.swatch}`} />
              <div className="p-3">
                <p className="font-mono text-xs font-semibold">{c.token}</p>
                <p className="text-xs text-muted">{c.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-md bg-surface p-6">
            <p className="text-xs text-muted">--font-display · Space Grotesk</p>
            <p className="mt-2 font-display text-2xl font-bold">One of one. Never twice.</p>
          </div>
          <div className="rounded-md bg-surface p-6">
            <p className="text-xs text-muted">--font-body · Inter</p>
            <p className="mt-2 font-body text-base">
              Every piece is graded, measured and photographed by hand before it goes live.
            </p>
          </div>
        </div>
        <ul className="mt-8 space-y-3">
          {typeScale.map((t) => (
            <li key={t.cls} className="flex items-baseline gap-4 overflow-hidden">
              <span className="w-24 shrink-0 font-mono text-xs text-muted">
                {t.cls} · {t.px}
              </span>
              <span className={`${t.cls} truncate font-display font-bold`}>Pre-loved denim</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-6">
          {radii.map((r) => (
            <div key={r.cls} className="text-center">
              <div className={`size-24 border-2 border-fg bg-surface ${r.cls}`} />
              <p className="mt-2 font-mono text-xs text-muted">{r.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing (Tailwind 4px scale)">
        <ul className="space-y-2">
          {spacing.map((s) => (
            <li key={s} className="flex items-center gap-4">
              <span className="w-24 font-mono text-xs text-muted">
                {s} · {s * 4}px
              </span>
              <span className={`h-3 rounded-sm bg-primary ${spacingWidth[s]}`} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Components preview">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-fg"
          >
            Add to cart
          </button>
          <button
            type="button"
            className="rounded-md border border-fg px-5 py-3 text-sm font-semibold"
          >
            Wishlist
          </button>
          <span className="rounded-sm bg-accent px-2 py-1 text-xs font-bold uppercase text-accent-fg">
            New drop
          </span>
          <span className="rounded-sm bg-sold px-2 py-1 text-xs font-bold uppercase text-fg">
            Sold
          </span>
        </div>
        <p className="mt-6 flex items-baseline gap-3">
          <span className="text-lg font-bold">{formatINR(49900)}</span>
          <span className="text-sm text-muted line-through">{formatINR(249900)}</span>
          <span className="text-sm font-semibold text-sale">est. retail · save 80%</span>
        </p>
        <p className="mt-4 text-xs text-muted">
          Press Tab to check the focus ring on the buttons above.
        </p>
      </Section>

      <Section title="Container">
        <div className="rounded-md border border-dashed border-muted p-4 text-sm text-muted">
          This page sits in <code>.site-container</code>: max 1440px, 16px side padding on mobile,
          32px from 1024px up.
        </div>
      </Section>
    </main>
  );
}
