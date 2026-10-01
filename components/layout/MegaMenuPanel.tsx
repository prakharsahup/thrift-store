import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GenderNav } from "@/lib/config/navigation";

type Props = {
  id: string;
  item: GenderNav;
  open: boolean;
  onNavigate: () => void;
};

// Full-width panel under the header. It is positioned against the sticky <header>, and stays in
// the DOM while closed (visibility: hidden), so it can fade and its links are skipped by Tab.
export function MegaMenuPanel({ id, item, open, onNavigate }: Props) {
  return (
    <div
      id={id}
      data-open={open}
      className="pointer-events-none invisible absolute inset-x-0 top-full -translate-y-1 border-b border-border bg-bg opacity-0 transition-[opacity,translate,visibility] duration-200 data-[open=true]:pointer-events-auto data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100"
    >
      <div className="site-container flex gap-10 py-8">
        <div className="flex-1">
          <Link
            href={item.href}
            onClick={onNavigate}
            className="mb-6 inline-flex items-center gap-2 font-display text-lg font-bold hover:text-primary"
          >
            Shop all {item.label.toLowerCase()}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-8">
            {item.columns.map((column) => {
              const headingId = `${id}-${column.title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
              return (
                <div key={column.title}>
                  <p
                    id={headingId}
                    className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase"
                  >
                    {column.title}
                  </p>
                  <ul aria-labelledby={headingId} className="space-y-2">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={onNavigate}
                          className="text-sm hover:text-primary hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <Link
          href={item.feature.href}
          onClick={onNavigate}
          className="group hidden w-48 shrink-0 xl:block"
        >
          <span className="relative block aspect-[3/4] overflow-hidden rounded-md bg-surface">
            <Image
              src={item.feature.image}
              alt=""
              fill
              sizes="192px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </span>
          <span className="mt-3 block text-xs font-semibold tracking-wider text-muted uppercase">
            {item.feature.eyebrow}
          </span>
          <span className="block font-display font-bold group-hover:text-primary">
            {item.feature.title}
          </span>
        </Link>
      </div>
    </div>
  );
}
