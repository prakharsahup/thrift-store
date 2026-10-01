import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils/money";

const cards = [
  { title: "Faded denim jacket", brand: "Vintage", price: 129900, size: "M" },
  { title: "Y2K baby tee", brand: "Unbranded", price: 49900, size: "S" },
] as const;

// The product-card hover from MOTION.md §5.10, CSS only: the second image crossfades in over 0.4s
// and the price row lifts 8px. Tailwind's hover: only applies on devices that can hover.
// The real ProductCard (catalogue phase) reuses these classes.
export function CardHoverDemo() {
  return (
    <ul className="grid max-w-xl grid-cols-2 gap-4">
      {cards.map((card) => (
        <li key={card.title}>
          <Link href="/dev/motion#signature" className="group block">
            <span className="relative block aspect-[3/4] overflow-hidden rounded-md bg-surface">
              <Image
                src="/placeholders/card-a.jpg"
                alt={`${card.title}, front`}
                fill
                sizes="(min-width: 640px) 18rem, 50vw"
                className="object-cover"
              />
              <Image
                src="/placeholders/card-b.jpg"
                alt=""
                fill
                sizes="(min-width: 640px) 18rem, 50vw"
                className="object-cover opacity-0 transition-opacity duration-400 group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </span>
            <span className="block transition-transform duration-400 group-hover:-translate-y-2 group-focus-visible:-translate-y-2">
              <span className="mt-3 block text-xs text-muted">
                {card.brand} · Size {card.size}
              </span>
              <span className="block text-sm font-medium">{card.title}</span>
              <span className="block text-sm font-bold">{formatINR(card.price)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
