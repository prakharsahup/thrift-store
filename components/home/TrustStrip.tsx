import Link from "next/link";
import { BadgeCheck, RotateCcw, Ruler, Truck } from "lucide-react";
import { shipping } from "@/lib/config/shipping";
import { formatINR } from "@/lib/utils/money";

// Trust strip (CLAUDE.md §8). COD joins this list if it's enabled in a later phase.
export function TrustStrip() {
  const items = [
    {
      Icon: BadgeCheck,
      title: "Hand-checked",
      body: "Every piece is inspected and cleaned before it's listed.",
    },
    {
      Icon: Ruler,
      title: "Graded & measured",
      body: "A condition grade and flat measurements on every item.",
    },
    {
      Icon: RotateCcw,
      title: "Easy returns",
      body: (
        <>
          Not right? See our{" "}
          <Link href="/returns" className="underline hover:text-primary">
            returns policy
          </Link>
          .
        </>
      ),
    },
    {
      Icon: Truck,
      title: `Free shipping over ${formatINR(shipping.freeAbovePaise)}`,
      body: `A flat ${formatINR(shipping.flatPaise)} below that, anywhere in India.`,
    },
  ];

  return (
    <section aria-label="Why shop with us" className="border-y border-border">
      <ul className="site-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <Icon aria-hidden className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-display font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
