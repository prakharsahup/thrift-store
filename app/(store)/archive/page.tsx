import type { Metadata } from "next";
import { ClaimedGrid } from "@/components/home/ClaimedGrid";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getArchive } from "@/lib/server/catalogue";

export const metadata: Metadata = {
  title: "Archive",
  description: "Every drop so far and what was claimed: one-of-one pieces that found a home.",
};

export const revalidate = 300;

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

// The archive (Drop Night design): each past drop as a contact sheet, claimed pieces greyed out
// under a sticker, then pieces claimed straight off the rack. Sold pages keep their URLs, so every
// tile still links to the piece's page.
export default async function ArchivePage() {
  const { drops, offRack } = await getArchive();
  const empty = drops.length === 0 && offRack.length === 0;

  return (
    <>
      <div className="site-container py-6 md:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Archive" }]} />
        <h1 className="mt-4 text-2xl font-bold md:text-3xl">Archive</h1>
        <p className="mt-3 max-w-prose text-base text-muted">
          Every drop so far, and what went. There&rsquo;s only ever one of each, so this is the
          closest you&rsquo;ll get to a restock.
        </p>
        {empty ? (
          <div className="mt-12 rounded-lg border border-border p-8">
            <p className="font-display font-bold text-xl">Nothing claimed yet.</p>
            <p className="mt-2 text-sm text-muted">Be the first.</p>
            <ButtonLink href="/search?sort=newest" className="mt-6">
              Shop new in
            </ButtonLink>
          </div>
        ) : null}
      </div>

      <div className="space-y-px pb-16">
        {drops.map(({ drop, pieces }) => (
          <ClaimedGrid
            key={drop.id}
            id={`archive-${drop.slug}`}
            title={drop.name}
            aside={`Dropped ${dateFormat.format(new Date(drop.goLiveAt))} · ${
              pieces.filter((p) => p.status === "sold").length
            } of ${pieces.length} claimed`}
            pieces={pieces}
            limit={48}
          />
        ))}
        {offRack.length > 0 ? (
          <ClaimedGrid
            id="archive-off-rack"
            title="Claimed off the rack"
            aside="No drop, no warning."
            pieces={offRack}
            limit={48}
          />
        ) : null}
      </div>
    </>
  );
}
