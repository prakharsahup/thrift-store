import Link from "next/link";
import { styleTags } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";

const tones = [
  "bg-primary text-primary-fg",
  "surface-dark bg-fg text-bg",
  "bg-accent text-accent-fg",
  "bg-surface text-fg",
] as const;

// "Shop by style" (CLAUDE.md §8): big type tiles, no imagery needed. Search filters by style.
export function StyleTiles() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {styleTags.map(([label, tag], i) => (
        <li key={tag}>
          <Link
            href={`/search?style=${tag}`}
            className={cn(
              "group flex aspect-square flex-col justify-between rounded-lg p-4 transition-transform duration-300 hover:-translate-y-1 md:p-5",
              tones[i % tones.length],
            )}
          >
            <span className="text-xs font-semibold tracking-widest uppercase opacity-80">
              Style {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-xl font-bold md:text-2xl">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
