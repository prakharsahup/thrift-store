import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { getDropName } from "@/lib/server/catalogue";

export const revalidate = 60;

// Rendered on first visit, then cached (same as product pages).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/drops/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const name = await getDropName(slug);
  return name ? { title: name, robots: { index: false } } : {};
}

// Placeholder drop page: banners and the drop banner already link here. The real page (countdown,
// "notify me", the drop's pieces) comes with the drops phase. Unknown or unpublished drops 404.
export default async function DropPage({ params }: PageProps<"/drops/[slug]">) {
  const { slug } = await params;
  const name = await getDropName(slug);
  if (!name) notFound();

  return (
    <ComingSoon
      title={name}
      body="Drop pages, with a countdown and a “notify me” sign-up, are on their way. Until then, everything that’s live is in the shop."
    />
  );
}
