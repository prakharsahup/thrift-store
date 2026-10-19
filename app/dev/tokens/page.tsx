import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Design tokens" };

// Class names are written out in full so Tailwind can detect them.
const colors = [
  { token: "--color-bg", value: "#100d16", swatch: "bg-bg", note: "Void · page background" },
  { token: "--color-fg", value: "#f5ecff", swatch: "bg-fg", note: "Near-white ink · text" },
  { token: "--color-muted", value: "#9f8bc2", swatch: "bg-muted", note: "Secondary text · 6.4:1" },
  {
    token: "--color-surface",
    value: "#19141f",
    swatch: "bg-surface",
    note: "Panel · section fill",
  },
  {
    token: "--color-primary",
    value: "#8855d9",
    swatch: "bg-primary",
    note: "Violet · CTAs, links",
  },
  {
    token: "--color-primary-fg",
    value: "#f5ecff",
    swatch: "bg-primary-fg",
    note: "Text on violet · 4.2:1",
  },
  {
    token: "--color-accent",
    value: "#c8a5ff",
    swatch: "bg-accent",
    note: "Lilac · badges, highlights",
  },
  {
    token: "--color-accent-fg",
    value: "#100d16",
    swatch: "bg-accent-fg",
    note: "Text on lilac · 9.4:1",
  },
  {
    token: "--color-sale",
    value: "#ff4d6d",
    swatch: "bg-sale",
    note: "Pink-red · savings, errors",
  },
  { token: "--color-sold", value: "#5c5468", swatch: "bg-sold", note: "SOLD badge fill" },
  { token: "--color-border", value: "#2e2740", swatch: "bg-border", note: "Dividers (decorative)" },
  { token: "--color-input", value: "#6b5f85", swatch: "bg-input", note: "Field outlines · 3.3:1" },
  {
    token: "--color-overlay",
    value: "void 70%",
    swatch: "bg-overlay",
    note: "Drawer / modal scrim",
  },
] as const;

const buttonVariantNames = ["primary", "secondary", "outline", "ghost", "link"] as const;
const buttonSizes = ["sm", "md", "lg"] as const;

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
                <p className="font-mono text-xs text-muted">{c.value}</p>
                <p className="text-xs text-muted">{c.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-md bg-surface p-6">
            <p className="text-xs text-muted">
              --font-display · Bricolage Grotesque (h1/h2 at 85% width)
            </p>
            <h2 className="mt-2 text-2xl font-bold">One of one. Never twice.</h2>
          </div>
          <div className="rounded-md bg-surface p-6">
            <p className="text-xs text-muted">--font-body · Instrument Sans</p>
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

      <Section title="Button (components/ui/Button.tsx)">
        <div className="space-y-4">
          {buttonSizes.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="w-10 font-mono text-xs text-muted">{size}</span>
              {buttonVariantNames.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
              <Button size={size} disabled>
                disabled
              </Button>
            </div>
          ))}
        </div>
        <div className="surface-dark mt-6 flex flex-wrap items-center gap-3 rounded-md bg-fg p-4 text-bg">
          <Button variant="overlay">overlay</Button>
          <Button variant="sold" disabled>
            Sold
          </Button>
          <span className="text-xs">Tab here: focus rings turn lilac on dark sections.</span>
        </div>
        <p className="mt-4 text-xs text-muted">
          Links styled as buttons use <code>ButtonLink</code>, which shares the same variants.
        </p>
      </Section>

      <Section title="Input (components/ui/Input.tsx)">
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tokens-input-default" className="mb-1 block text-sm font-semibold">
              Default (md)
            </label>
            <Input id="tokens-input-default" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="tokens-input-filled" className="mb-1 block text-sm font-semibold">
              Filled (search)
            </label>
            <Input id="tokens-input-filled" tone="filled" placeholder="Search brands" />
          </div>
          <div>
            <label htmlFor="tokens-input-invalid" className="mb-1 block text-sm font-semibold">
              Invalid
            </label>
            <Input id="tokens-input-invalid" aria-invalid defaultValue="not-an-email" />
          </div>
          <div>
            <label htmlFor="tokens-input-disabled" className="mb-1 block text-sm font-semibold">
              Disabled
            </label>
            <Input id="tokens-input-disabled" disabled defaultValue="Can't edit" />
          </div>
        </div>
      </Section>

      <Section title="Badges and prices">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-sm bg-accent px-2 py-1 text-xs font-bold uppercase text-accent-fg">
            New drop
          </span>
          <span className="rounded-sm bg-sold px-2 py-1 text-xs font-bold uppercase text-fg">
            Sold
          </span>
        </div>
        <p className="mt-6 flex items-baseline gap-3">
          <span className="text-lg font-bold">{formatMoney(49900)}</span>
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
