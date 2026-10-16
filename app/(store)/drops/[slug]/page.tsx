import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { DropAlertForm } from "@/components/drops/DropAlertForm";
import { DropHero } from "@/components/drops/DropHero";
import { ClaimExplainer } from "@/components/home/ClaimExplainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { dropPhase, dropTimeLabel, piecesLabel } from "@/lib/drops/phase";
import { getDrop, getDropPieces } from "@/lib/server/catalogue";

export const revalidate = 60;

const droppedFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

// Rendered on first visit, then cached (same as product pages).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/drops/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const drop = await getDrop(slug);
  if (!drop) return {};
  return {
    title: drop.name,
    description: drop.description || `${drop.name}: one-of-one pieces, graded and measured.`,
    alternates: { canonical: `/drops/${drop.slug}` },
  };
}

// Drop page (CLAUDE.md §4, Drop Night design). Before go-live: countdown, teaser crops and the
// alert sign-up; the pieces themselves stay hidden by RLS. After: every piece, claimed ones
// stickered. Unknown or unpublished drops 404.
export default async function DropPage({ params }: PageProps<"/drops/[slug]">) {
  const { slug } = await params;
  const drop = await getDrop(slug);
  if (!drop) notFound();
  const pieces = drop.isLive ? await getDropPieces(drop.id, 96) : [];
  // A week after go-live a drop stops being "live now" and reads as a dated release.
  const fresh = dropPhase(drop).phase === "live";
  const dropped = `Dropped ${droppedFormat.format(new Date(drop.goLiveAt))}`;

  return (
    <>
      <div className="site-container pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Drops", href: "/drops" },
            { label: drop.name },
          ]}
        />
      </div>

      {drop.isLive ? (
        <DropHero
          eyebrow={fresh ? "Live now" : dropped}
          title={drop.name}
          sticker={`${piecesLabel(drop.pieceCount)}${fresh ? " · live now" : ""}`}
          body={drop.description}
          primary={{ href: "#drop-pieces", label: "See every piece" }}
        />
      ) : (
        <>
          <DropHero
            eyebrow="Next drop"
            title={drop.name}
            sticker={`${dropTimeLabel(drop.goLiveAt)} · ${piecesLabel(drop.pieceCount)}`}
            countdownTo={drop.goLiveAt}
            primary={{ href: "#drop-page-alert", label: "Get the drop alert" }}
          />
          <section
            id="drop-page-alert"
            aria-labelledby="drop-alert-title"
            className="site-container grid gap-8 border-t border-border py-14 md:py-20 lg:grid-cols-2 lg:items-end"
          >
            <div>
              <h2 id="drop-alert-title" className="text-2xl text-accent md:text-3xl">
                Get the alert before the drop.
              </h2>
              {drop.description ? (
                <p className="mt-4 max-w-prose text-base text-muted">{drop.description}</p>
              ) : null}
            </div>
            <DropAlertForm
              dropId={drop.id}
              id="drop-page-alert-email"
              className="lg:justify-self-end"
            />
          </section>
        </>
      )}

      {drop.isLive ? (
        <section
          id="drop-pieces"
          aria-labelledby="drop-pieces-title"
          className="site-container pb-16 md:pb-24"
        >
          <h2 id="drop-pieces-title" className="mb-8 text-2xl md:text-3xl">
            Every piece
          </h2>
          <ProductGrid
            products={pieces}
            total={pieces.length}
            loadMoreHref={null}
            emptyState={
              <p className="text-sm text-muted">
                Everything from this drop has been claimed or taken down.
              </p>
            }
          />
        </section>
      ) : null}
      <ClaimExplainer />
    </>
  );
}
