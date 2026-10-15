import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CountUp } from "@/components/motion/CountUp";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Magnetic } from "@/components/motion/Magnetic";
import { Marquee } from "@/components/motion/Marquee";
import { MaskedVideo } from "@/components/motion/MaskedVideo";
import { Parallax } from "@/components/motion/Parallax";
import { RevealImage } from "@/components/motion/RevealImage";
import { RevealText } from "@/components/motion/RevealText";
import { StackCards } from "@/components/motion/StackCards";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CardHoverDemo } from "./_components/CardHoverDemo";
import { DemoSection } from "./_components/DemoSection";
import { MotionCheck } from "./_components/MotionCheck";
import { MotionPlayground } from "./_components/MotionPlayground";

export const metadata: Metadata = { title: "Motion playground" };

// One section per MOTION.md §5 component. Each effect is built here first and approved by the
// owner before it is used on real pages. All copy and media here are original placeholders.
const contents = [
  ["check", "Motion settings"],
  ["smooth-scroll", "SmoothScroll"],
  ["marquee", "Marquee"],
  ["hover-marquee", "HoverMarquee"],
  ["reveal-text", "RevealText"],
  ["reveal-image", "RevealImage"],
  ["parallax", "Parallax"],
  ["masked-video", "MaskedVideo"],
  ["stack-cards", "StackCards"],
  ["page-transition", "PageTransition"],
  ["signature", "Signature details"],
] as const;

const marqueeItems = [
  "Pre-loved denim",
  "Vintage tees",
  "Y2K finds",
  "One of one",
  "Graded & measured",
  "New drops weekly",
];

const stackCards = [
  {
    eyebrow: "Why thrift",
    title: "The greenest jacket is the one that already exists.",
    body: "Buying it a second time keeps it out of landfill and skips the water, dye and freight a brand-new piece would cost.",
  },
  {
    eyebrow: "Graded & measured",
    title: "Size labels lie. Tape measures don't.",
    body: "Every item gets a condition grade, honest photos of any flaws, and flat measurements in centimetres.",
  },
  {
    eyebrow: "One of one",
    title: "There's exactly one of everything.",
    body: "When it's gone, it's gone. Watch a piece and we'll email you if it ever comes back.",
  },
  {
    eyebrow: "Sell with us",
    title: "Good clothes deserve a second wardrobe.",
    body: "Send in what you don't wear. We clean, grade and list it, and you get paid when it sells.",
  },
];

export default function MotionPlaygroundPage() {
  return (
    <MotionPlayground>
      <main className="pt-10 pb-[50vh]">
        <div className="site-container pb-12">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">
            Dev only · not in production builds
          </p>
          <RevealText
            as="h1"
            trigger="load"
            className="mt-3 max-w-4xl text-3xl font-bold md:text-4xl"
          >
            Motion playground. Every effect is tuned here before it touches a real page.
          </RevealText>
          <p className="mt-4 max-w-prose text-sm text-muted">
            Open &ldquo;Tune motion&rdquo; (bottom right) to change durations, eases, staggers and
            scroll feel live, then &ldquo;Copy values&rdquo; to keep them. Test with &ldquo;Pause
            animations&rdquo; on and off: every effect must show its final state when paused.
          </p>
          <nav aria-label="Effects" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {contents.map(([id, name]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="inline-block rounded-sm bg-surface px-2 py-1 text-xs font-medium hover:bg-border"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <DemoSection
          id="check"
          title="Motion settings check"
          description="Use “Pause animations” in the header, or turn on reduced motion in your OS. The boxes should appear instantly, and the choice should survive a reload."
        >
          <MotionCheck />
        </DemoSection>

        <DemoSection
          id="smooth-scroll"
          title="SmoothScroll"
          spec="5.1"
          description="On for this whole page. Scroll with a mouse wheel or trackpad and compare with /dev/tokens, which scrolls natively. Touch scrolling stays native. Tune with lenis.lerp."
        >
          <p className="text-sm">
            <Link href="/dev/tokens" className="font-semibold text-primary underline">
              Compare with native scrolling on /dev/tokens
            </Link>
          </p>
        </DemoSection>

        <DemoSection
          id="marquee"
          title="Marquee"
          spec="5.2"
          description={
            <>
              CSS-only loop. Hover to pause. Props: <code>speed</code> (seconds per loop),{" "}
              <code>direction</code>, <code>separator</code>.
            </>
          }
        >
          <div className="-mx-4 space-y-3 lg:-mx-8">
            <Marquee
              items={marqueeItems}
              label="What we sell"
              className="bg-fg py-4 font-display text-xl font-bold text-bg uppercase md:text-2xl"
            />
            <Marquee
              items={marqueeItems}
              direction="right"
              speed={45}
              separator="✦"
              className="border-y border-fg py-3 text-sm font-semibold tracking-wide uppercase"
            />
            <Marquee
              items={["Free shipping over $999", "New drop every Friday"]}
              speed={20}
              className="bg-accent py-2 text-xs font-semibold text-accent-fg"
            />
          </div>
        </DemoSection>

        <DemoSection
          id="hover-marquee"
          title="HoverMarquee"
          spec="5.3"
          description="Hover with a mouse, or Tab to a button. Touch screens keep the static label."
        >
          <div className="flex flex-wrap gap-4">
            <HoverMarquee href="/dev/motion#hover-marquee" label="Shop now" />
            <HoverMarquee href="/dev/motion#hover-marquee" label="See the drop" variant="outline" />
            <HoverMarquee
              href="/dev/motion#hover-marquee"
              label="Shop women"
              className="w-56 justify-center"
            />
          </div>
        </DemoSection>

        <DemoSection
          id="reveal-text"
          title="RevealText"
          spec="5.4"
          description="Lines rise out of a mask as they scroll in (the page title above uses trigger=“load”). Resize the window: lines re-split without replaying. Tune with dur.slow, ease.out and stagger.lines."
        >
          <RevealText as="h3" className="max-w-4xl font-display text-2xl font-bold md:text-4xl">
            Pre-loved, hand-picked and measured flat, so the jacket that fits in the photo fits on
            you.
          </RevealText>
          <RevealText className="mt-6 max-w-prose text-base text-muted md:text-lg" delay={0.15}>
            Body copy can reveal too, with a short delay after its heading. Keep it to intros: long
            paragraphs feel slow when every line waits its turn.
          </RevealText>
        </DemoSection>

        <DemoSection
          id="reveal-image"
          title="RevealImage"
          spec="5.5"
          description="The frame wipes open upward while the image settles from 1.15× to 1×. Once per image."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <RevealImage
                key={n}
                src={`/placeholders/look-${n}.jpg`}
                alt={`Placeholder look ${n}`}
                sizes="(min-width: 640px) 33vw, 100vw"
                className="aspect-[3/4] w-full rounded-md"
              />
            ))}
          </div>
        </DemoSection>

        <DemoSection
          id="parallax"
          title="Parallax"
          spec="5.6"
          description="Content drifts slower than the page. The banner uses amount=10; the portraits use 6 and 16 to compare."
        >
          <Parallax className="aspect-[2/1] w-full rounded-lg">
            <Image
              src="/placeholders/banner.jpg"
              alt="Placeholder banner"
              fill
              sizes="(min-width: 1440px) 1376px, 100vw"
              className="object-cover"
            />
          </Parallax>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[
              { n: 2, amount: 6 },
              { n: 4, amount: 16 },
            ].map(({ n, amount }) => (
              <figure key={n}>
                <Parallax amount={amount} className="aspect-[3/4] w-full rounded-md">
                  <Image
                    src={`/placeholders/look-${n}.jpg`}
                    alt={`Placeholder look ${n}`}
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                </Parallax>
                <figcaption className="mt-2 font-mono text-xs text-muted">
                  amount={amount}
                </figcaption>
              </figure>
            ))}
          </div>
        </DemoSection>

        <DemoSection
          id="masked-video"
          title="MaskedVideo"
          spec="5.7"
          description="Grows from 0.6× to full size as it scrolls to the centre. Plays only while on screen; with animations paused you see the poster. Placeholder clip: 10s, 120KB MP4 / 60KB WebM."
        >
          <MaskedVideo
            mp4="/placeholders/loop.mp4"
            webm="/placeholders/loop.webm"
            poster="/placeholders/loop-poster.jpg"
          />
          <MaskedVideo
            shape="pill"
            mp4="/placeholders/loop.mp4"
            webm="/placeholders/loop.webm"
            poster="/placeholders/loop-poster.jpg"
            className="mt-12"
          />
        </DemoSection>

        <DemoSection
          id="stack-cards"
          title="StackCards"
          spec="5.8"
          description="From 768px: cards stick and stack, and the one underneath shrinks and dims. On phones: a plain list that fades in."
        >
          <StackCards cards={stackCards} />
        </DemoSection>

        <DemoSection
          id="page-transition"
          title="PageTransition"
          spec="5.9"
          description="Enter-only wipe for brand pages (it will live in app/(brand)/template.tsx). It runs on in-app navigation, not on a full page load."
        >
          <ButtonLink href="/dev/transition" size="lg">
            Open the transition demo
          </ButtonLink>
        </DemoSection>

        <DemoSection
          id="signature"
          title="Signature details"
          spec="5.10"
          description="Magnetic CTA (desktop only, max 6px), counters that run once, and the product-card hover. Bilingual subheads wait for the owner to pick a second language."
        >
          <div className="flex flex-wrap items-center gap-6">
            <Magnetic>
              <HoverMarquee href="/dev/motion#signature" label="Shop the drop" />
            </Magnetic>
            <Magnetic>
              <Button variant="outline" size="lg">
                Magnetic button
              </Button>
            </Magnetic>
          </div>

          <dl className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { value: 12480, suffix: "", label: "Pieces rescued from landfill" },
              { value: 3200, suffix: " kg", label: "Textiles kept in use" },
              { value: 98, suffix: "%", label: "Orders rated as described" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-muted">{stat.label}</dt>
                <dd className="font-display text-3xl font-bold md:text-4xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">Demo numbers, not real figures.</p>

          <div className="mt-12">
            <CardHoverDemo />
          </div>
        </DemoSection>
      </main>
    </MotionPlayground>
  );
}
