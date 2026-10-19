// How claiming works, as one poster sentence (Drop Night design). Matches the real checkout: a
// piece is held for 15 minutes from the moment you start checkout (reserve_products), not before.
export function ClaimExplainer() {
  const arrow = (
    <span aria-hidden className="font-body text-accent">
      {" "}
      →{" "}
    </span>
  );
  return (
    <section id="how-claiming-works" aria-labelledby="claim-title" className="site-container">
      <div className="border-b border-border py-14 md:py-20">
        <h2 id="claim-title" className="sr-only">
          How claiming works
        </h2>
        <p className="max-w-6xl font-display font-bold text-2xl leading-tight md:text-3xl">
          Hit checkout{arrow}it&rsquo;s held for you for 15 minutes{arrow}pay, or it goes back on
          the rack.
        </p>
        <p className="mt-6 max-w-prose text-sm text-muted">
          One of each, no restocks. Your cart doesn&rsquo;t hold anything; the first person to check
          out gets it. Every piece is graded and measured, with flaws listed.
        </p>
      </div>
    </section>
  );
}
