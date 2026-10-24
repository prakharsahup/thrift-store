import type { MetadataRoute } from "next";
import { genders } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";
import { getAllCategorySlugs, getDrops, getSitemapProducts } from "@/lib/server/catalogue";

// Public, indexable routes only. Account/checkout/admin/order pages are all noindex'd via
// generateMetadata and have no business appearing here (CLAUDE.md phase 8).
const STATIC_PATHS = [
  "/",
  "/about",
  "/lookbook",
  "/archive",
  "/drops",
  "/search",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping",
  "/contact",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");
  const url = (path: string) => `${base}${path}`;

  const [products, categorySlugs, { upcoming, past }] = await Promise.all([
    getSitemapProducts(),
    getAllCategorySlugs(),
    getDrops(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: url(path),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));

  const genderEntries: MetadataRoute.Sitemap = genders.map((gender) => ({
    url: url(`/${gender}`),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: url(`/c/${slug}`),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const dropEntries: MetadataRoute.Sitemap = [...upcoming, ...past].map((drop) => ({
    url: url(`/drops/${drop.slug}`),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map(({ slug, lastModified }) => ({
    url: url(`/p/${slug}`),
    lastModified: new Date(lastModified),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...genderEntries,
    ...categoryEntries,
    ...dropEntries,
    ...productEntries,
  ];
}
