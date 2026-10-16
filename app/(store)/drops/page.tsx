import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DropCountdown } from "@/components/drops/DropCountdown";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { dropTimeLabel, piecesLabel } from "@/lib/drops/phase";
import { getDrops } from "@/lib/server/catalogue";

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Upcoming and past drops: small batches of one-of-one pieces, released at a set time.",
};

export const revalidate = 60;

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const groupHeading = "mb-4 font-body text-xs font-bold tracking-widest text-muted uppercase";

// Every published drop: what's coming (with countdowns), then everything that has dropped.
export default async function DropsPage() {
  const { upcoming, past } = await getDrops();

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Drops" }]} />
      <h1 className="mt-4 text-3xl text-accent md:text-4xl">Drops</h1>
      <p className="mt-3 max-w-prose text-base text-muted">
        Small batches, released at a set time. Pieces stay hidden until the drop opens; then
        it&rsquo;s pehle aao, pehle pao.
      </p>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="mt-12 border border-border p-8">
          <p className="font-display text-xl">No drops scheduled yet.</p>
          <p className="mt-2 text-sm text-muted">Everything that&rsquo;s live is in the shop.</p>
          <ButtonLink href="/search?sort=newest" className="mt-6">
            Shop new in
          </ButtonLink>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-labelledby="drops-upcoming" className="mt-12">
          <h2 id="drops-upcoming" className={groupHeading}>
            Coming up
          </h2>
          <ul className="space-y-6">
            {upcoming.map((drop) => (
              <li
                key={drop.id}
                className="flex flex-col gap-6 border border-accent p-6 md:flex-row md:items-end md:justify-between md:p-8"
              >
                <div>
                  <Link
                    href={`/drops/${drop.slug}`}
                    className="font-display text-2xl text-accent hover:text-fg md:text-3xl"
                  >
                    {drop.name}
                  </Link>
                  <p className="mt-3 block w-fit -rotate-1 bg-fg px-3 py-1 font-display text-sm text-bg">
                    {dropTimeLabel(drop.goLiveAt)} · {piecesLabel(drop.pieceCount)}
                  </p>
                </div>
                <DropCountdown target={drop.goLiveAt} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section aria-labelledby="drops-past" className="mt-12 pb-8">
          <h2 id="drops-past" className={groupHeading}>
            Already dropped
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {past.map((drop) => (
              <li key={drop.id}>
                <Link
                  href={`/drops/${drop.slug}`}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5"
                >
                  <span className="font-display text-xl group-hover:text-accent md:text-2xl">
                    {drop.name}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-muted">
                    {dateFormat.format(new Date(drop.goLiveAt))} · {piecesLabel(drop.pieceCount)}
                    <ArrowRight aria-hidden className="size-4 group-hover:text-accent" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/archive"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase hover:text-fg"
          >
            See what was claimed <ArrowRight aria-hidden className="size-4" />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
