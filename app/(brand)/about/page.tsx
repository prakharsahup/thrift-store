import type { Metadata } from "next";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Magnetic } from "@/components/motion/Magnetic";
import { MaskedVideo } from "@/components/motion/MaskedVideo";
import { RevealImage } from "@/components/motion/RevealImage";
import { RevealText } from "@/components/motion/RevealText";
import { StackCards } from "@/components/motion/StackCards";
import { genderNav } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${site.name} exists, and how every piece is checked, graded and measured before it's listed.`,
};

// Placeholder copy — the owner should rewrite this in their own voice.
const steps = [
  {
    eyebrow: "Sourced",
    title: "We hunt so you don't have to.",
    body: "Pieces come from closets, collectors and wholesale vintage bales. We keep maybe one in five.",
  },
  {
    eyebrow: "Checked",
    title: "Cleaned, steamed, inspected.",
    body: "Every item is washed or steamed and checked seam by seam. Anything we can mend, we mend.",
  },
  {
    eyebrow: "Graded & measured",
    title: "No guessing about fit or wear.",
    body: "We give each piece an honest condition grade, photograph any flaws, and measure it flat in centimetres.",
  },
  {
    eyebrow: "Shipped",
    title: "Packed in recycled mailers.",
    body: "Your piece ships within two working days, tracked, to anywhere in India.",
  },
];

// About (MOTION.md §6): RevealText headings, StackCards for the process, one MaskedVideo.
export default function AboutPage() {
  return (
    <>
      <section className="site-container py-16 md:py-24">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          About {site.name}
        </p>
        <RevealText
          as="h1"
          trigger="load"
          className="mt-3 max-w-4xl text-3xl font-bold md:text-4xl"
        >
          Second-hand, first-rate. We find the good stuff and tell you the truth about it.
        </RevealText>
        <RevealText
          trigger="load"
          delay={0.2}
          className="mt-6 max-w-prose text-base text-muted md:text-lg"
        >
          {site.name} started with a simple frustration: thrift shopping online meant blurry photos,
          vague sizes and surprises at the door. So we built the shop we wanted — every piece one of
          one, every flaw shown, every measurement taken by hand.
        </RevealText>
      </section>

      <div className="site-container">
        <RevealImage
          src="/placeholders/banner.jpg"
          alt="Placeholder image of the studio"
          sizes="(min-width: 1440px) 1376px, 100vw"
          priority
          trigger="load"
          className="aspect-[2/1] w-full rounded-lg"
        />
      </div>

      <section aria-labelledby="about-process" className="site-container py-16 md:py-24">
        <p className="mb-2 text-xs font-semibold tracking-widest text-accent uppercase">
          How it works
        </p>
        <RevealText as="h2" id="about-process" className="mb-10 text-2xl font-bold md:text-3xl">
          How a piece gets to you.
        </RevealText>
        <StackCards cards={steps} />
      </section>

      <section aria-labelledby="about-belief" className="bg-surface py-16 md:py-24">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <RevealText as="h2" id="about-belief" className="text-2xl font-bold md:text-4xl">
              The most sustainable wardrobe is the one that&rsquo;s already been made.
            </RevealText>
            <RevealText className="mt-6 max-w-prose text-base text-muted md:text-lg">
              Fashion makes more clothes than anyone can wear. Every piece we rehome is one that
              didn&rsquo;t need new cotton, new dye or a new factory run — and one that didn&rsquo;t
              end up in landfill.
            </RevealText>
          </div>
          <MaskedVideo
            mp4="/placeholders/loop.mp4"
            webm="/placeholders/loop.webm"
            poster="/placeholders/loop-poster.jpg"
            shape="pill"
          />
        </div>
      </section>

      <section aria-labelledby="about-cta" className="site-container py-16 text-center md:py-24">
        <RevealText as="h2" id="about-cta" className="text-2xl font-bold md:text-3xl">
          Ready to find your one of one?
        </RevealText>
        <ul className="mt-8 flex flex-wrap justify-center gap-4">
          {genderNav.map((item) => (
            <li key={item.gender}>
              <Magnetic>
                <HoverMarquee href={item.href} label={`Shop ${item.label.toLowerCase()}`} />
              </Magnetic>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
