import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealText } from "@/components/motion/RevealText";
import { styleTags } from "@/lib/config/navigation";

// "Shop by style" (CLAUDE.md §8) as an editorial index: a full-width kraft band with each style set
// big, numbered, and linking to search filtered by that style. Type does the work; no imagery needed.
export function StyleIndex() {
  return (
    <section aria-labelledby="home-styles" className="bg-surface py-16 md:py-24">
      <div className="site-container grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <RevealText as="h2" id="home-styles" className="text-3xl font-bold md:text-4xl">
            Shop by style
          </RevealText>
          <p className="mt-4 max-w-sm text-base text-muted">
            Six ways in. Pick a mood and see every one-of-one piece that fits it.
          </p>
        </div>
        <ol className="border-t-2 border-fg">
          {styleTags.map(([label, tag], i) => (
            <li key={tag} className="border-b border-input">
              <Link
                href={`/search?style=${tag}`}
                className="group flex items-center gap-4 py-4 transition-colors hover:text-primary md:py-5"
              >
                <span className="w-8 shrink-0 text-xs font-semibold text-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-2xl leading-none font-bold tracking-tight font-stretch-[85%] md:text-3xl">
                  {label}
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="size-6 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
