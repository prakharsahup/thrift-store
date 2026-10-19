import { CountUp } from "@/components/motion/CountUp";
import { RevealText } from "@/components/motion/RevealText";
import type { ImpactStats as Stats } from "@/lib/server/catalogue";

type Props = { stats: Stats };

// Live numbers from the catalogue, counted up once on scroll (MOTION.md §6 step 7).
export function ImpactStats({ stats }: Props) {
  const items = [
    { value: stats.listed, suffix: "", label: "One-of-one pieces in the shop right now" },
    { value: stats.rehomed, suffix: "", label: "Pieces rehomed instead of thrown away" },
  ];

  return (
    <section aria-labelledby="home-impact" className="bg-surface py-16 md:py-24">
      <div className="site-container">
        <RevealText as="h2" id="home-impact" className="max-w-2xl text-2xl font-bold md:text-3xl">
          Every piece here is one less thing made from scratch.
        </RevealText>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col-reverse gap-2 border-t border-fg pt-4">
              <dt className="text-sm text-muted">{item.label}</dt>
              <dd className="font-display text-3xl font-bold md:text-4xl">
                <CountUp value={item.value} suffix={item.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
