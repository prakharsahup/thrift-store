import "server-only";
import { cache } from "react";
import { compareSizes, type Filters } from "@/lib/catalogue/filters";
import { conditions as conditionGrades, type ProductCondition } from "@/lib/config/conditions";
import { styleTags } from "@/lib/config/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import { savingPercent } from "@/lib/utils/money";

// Public catalogue reads for brand and store pages. They use the cookie-free client, so pages can
// be cached. A failed query is logged and returns an empty result: the page renders without that
// section instead of crashing.

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  taggedSize: string | null;
  condition: ProductCondition;
  pricePaise: number;
  originalPricePaise: number | null;
  /** Expired holds already read as "available". */
  status: "available" | "reserved" | "sold";
  images: { url: string; alt: string }[];
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string;
  linkUrl: string;
  ctaLabel: string;
};

export type CategoryTile = { slug: string; name: string; imageUrl: string | null };

export type FeaturedDrop = {
  slug: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  goLiveAt: string;
  isLive: boolean;
};

export type ImpactStats = { listed: number; rehomed: number; averageSavingPercent: number };

const PRODUCT_CARD_COLUMNS =
  "id, slug, title, brand, tagged_size, condition, price_paise, original_price_paise, status, effective_status, product_images(url, alt, sort_order)";

const SOLD_LISTING_DAYS = 7;

function client() {
  return hasSupabaseEnv() ? createPublicClient() : null;
}

function logError(where: string, error: { message: string } | null): void {
  if (error) console.error(`[catalogue] ${where}: ${error.message}`);
}

type Supabase = NonNullable<ReturnType<typeof client>>;

function soldCutoffIso(): string {
  return new Date(Date.now() - SOLD_LISTING_DAYS * 86_400_000).toISOString();
}

/** Non-draft products, minus items sold more than 7 days ago (CLAUDE.md §4). */
function listedProducts(supabase: Supabase, options: { count?: boolean } = {}) {
  return supabase
    .from("products")
    .select(PRODUCT_CARD_COLUMNS, { count: options.count ? "exact" : undefined })
    .neq("status", "draft")
    .or(`status.neq.sold,sold_at.gt.${soldCutoffIso()}`)
    .order("sort_order", { referencedTable: "product_images" });
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  tagged_size: string | null;
  condition: ProductCondition;
  price_paise: number;
  original_price_paise: number | null;
  status: string;
  effective_status: string | null;
  product_images: { url: string; alt: string; sort_order: number }[];
};

function toCard(row: ProductRow): ProductCardData | null {
  const status = row.effective_status ?? row.status;
  if (status !== "available" && status !== "reserved" && status !== "sold") return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    taggedSize: row.tagged_size,
    condition: row.condition,
    pricePaise: row.price_paise,
    originalPricePaise: row.original_price_paise,
    status,
    images: row.product_images.map(({ url, alt }) => ({ url, alt })),
  };
}

function toCards(rows: ProductRow[] | null): ProductCardData[] {
  return (rows ?? []).flatMap((row) => toCard(row) ?? []);
}

/** Newest listed products ("Just dropped"). */
export async function getNewArrivals(limit = 12): Promise<ProductCardData[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await listedProducts(supabase)
    .order("published_at", { ascending: false })
    .limit(limit);
  logError("getNewArrivals", error);
  return toCards(data);
}

/** Buyable products at or under a price, newest first. */
export async function getProductsUnder(maxPaise: number, limit = 12): Promise<ProductCardData[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await listedProducts(supabase)
    .in("status", ["available", "reserved"])
    .lte("price_paise", maxPaise)
    .order("published_at", { ascending: false })
    .limit(limit);
  logError("getProductsUnder", error);
  return toCards(data);
}

/** Active hero banners (RLS hides inactive and out-of-window ones). */
export async function getBanners(): Promise<Banner[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, subtitle, image_url, image_alt, link_url, cta_label")
    .order("sort_order");
  logError("getBanners", error);
  return (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: b.image_url,
    imageAlt: b.image_alt,
    linkUrl: b.link_url,
    ctaLabel: b.cta_label,
  }));
}

/** Categories by slug, returned in the order given. */
export async function getCategoryTiles(slugs: readonly string[]): Promise<CategoryTile[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, image_url")
    .in("slug", [...slugs]);
  logError("getCategoryTiles", error);
  const bySlug = new Map((data ?? []).map((c) => [c.slug, c]));
  return slugs.flatMap((slug) => {
    const c = bySlug.get(slug);
    return c ? [{ slug: c.slug, name: c.name, imageUrl: c.image_url }] : [];
  });
}

/** The next upcoming published drop, or else the most recent live one. */
export async function getFeaturedDrop(): Promise<FeaturedDrop | null> {
  const supabase = client();
  if (!supabase) return null;
  const now = new Date().toISOString();
  const columns = "slug, name, description, banner_url, go_live_at";

  const upcoming = await supabase
    .from("drops")
    .select(columns)
    .gt("go_live_at", now)
    .order("go_live_at")
    .limit(1)
    .maybeSingle();
  logError("getFeaturedDrop (upcoming)", upcoming.error);

  const drop =
    upcoming.data ??
    (
      await supabase
        .from("drops")
        .select(columns)
        .lte("go_live_at", now)
        .order("go_live_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data;
  if (!drop) return null;

  return {
    slug: drop.slug,
    name: drop.name,
    description: drop.description,
    bannerUrl: drop.banner_url,
    goLiveAt: drop.go_live_at,
    isLive: drop.go_live_at <= now,
  };
}

/** Real numbers for the impact counters. */
export async function getImpactStats(): Promise<ImpactStats | null> {
  const supabase = client();
  if (!supabase) return null;

  const [listed, rehomed, prices] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .in("status", ["available", "reserved"]),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "sold"),
    // TODO: move to a SQL view once the catalogue is large; fine for hundreds of rows.
    supabase
      .from("products")
      .select("price_paise, original_price_paise")
      .neq("status", "draft")
      .not("original_price_paise", "is", null),
  ]);
  logError("getImpactStats", listed.error ?? rehomed.error ?? prices.error);
  if (listed.error || rehomed.error || prices.error) return null;

  const savings = (prices.data ?? []).flatMap((p) =>
    p.original_price_paise ? [savingPercent(p.price_paise, p.original_price_paise)] : [],
  );
  const averageSavingPercent = savings.length
    ? Math.round(savings.reduce((sum, s) => sum + s, 0) / savings.length)
    : 0;

  return { listed: listed.count ?? 0, rehomed: rehomed.count ?? 0, averageSavingPercent };
}

// ---------------------------------------------------------------------------
// Listings and search
// ---------------------------------------------------------------------------

export type CategoryNode = { id: string; slug: string; name: string; gender: string };

export type CategoryPage = CategoryNode & {
  parent: CategoryNode | null;
  /** Sub-categories of this category, or of its parent for a sub-category (for sibling links). */
  children: CategoryNode[];
  /** This category plus its sub-categories: what the listing includes. */
  ids: string[];
};

async function allCategories(supabase: Supabase) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, gender, parent_id, sort_order")
    .order("sort_order");
  logError("allCategories", error);
  return data ?? [];
}

/**
 * A category with its parent and children, or null if the slug doesn't exist.
 * Wrapped in React cache(): the layout, metadata and page share one query per request.
 */
export const getCategoryPage = cache(async function getCategoryPage(
  slug: string,
): Promise<CategoryPage | null> {
  const supabase = client();
  if (!supabase) return null;
  const all = await allCategories(supabase);
  const category = all.find((c) => c.slug === slug);
  if (!category) return null;

  const node = (c: (typeof all)[number]): CategoryNode => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    gender: c.gender,
  });
  const parent = all.find((c) => c.id === category.parent_id) ?? null;
  const ownChildren = all.filter((c) => c.parent_id === category.id);
  const siblings = parent ? all.filter((c) => c.parent_id === parent.id) : [];

  return {
    ...node(category),
    parent: parent ? node(parent) : null,
    children: (ownChildren.length > 0 ? ownChildren : siblings).map(node),
    ids: [category.id, ...ownChildren.map((c) => c.id)],
  };
});

/** Root categories (Men / Women / Unisex) with all their descendant ids — for the search filter. */
export async function getCategoryGroups(): Promise<(CategoryNode & { ids: string[] })[]> {
  const supabase = client();
  if (!supabase) return [];
  const all = await allCategories(supabase);
  return all
    .filter((c) => c.parent_id === null)
    .map((root) => ({
      id: root.id,
      slug: root.slug,
      name: root.name,
      gender: root.gender,
      ids: [root.id, ...all.filter((c) => c.parent_id === root.id).map((c) => c.id)],
    }));
}

/** "jackets kora" becomes "jackets:* & kora:*": prefix matching, so partial words find results. */
function toPrefixQuery(text: string): string {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words
    .slice(0, 6)
    .map((w) => `${w}:*`)
    .join(" & ");
}

export type ProductQuery = Omit<Filters, "categories" | "page"> & {
  /** Restrict to these category ids (null = all). */
  categoryIds: string[] | null;
  limit: number;
};

/** Filtered, sorted listing for PLP and search. Returns up to `limit` cards and the total count. */
export async function listProducts(
  query: ProductQuery,
): Promise<{ products: ProductCardData[]; total: number }> {
  const supabase = client();
  if (!supabase) return { products: [], total: 0 };

  let q = listedProducts(supabase, { count: true });
  if (query.categoryIds) q = q.in("category_id", query.categoryIds);
  const tsQuery = toPrefixQuery(query.q);
  if (tsQuery) q = q.textSearch("search", tsQuery, { config: "english" });
  if (query.sizes.length) q = q.in("tagged_size", query.sizes);
  if (query.conditions.length) q = q.in("condition", query.conditions);
  if (query.brands.length) q = q.in("brand", query.brands);
  if (query.styles.length) q = q.overlaps("style_tags", query.styles);
  if (query.minRupees !== null) q = q.gte("price_paise", query.minRupees * 100);
  if (query.maxRupees !== null) q = q.lte("price_paise", query.maxRupees * 100);

  // Available pieces first, then on hold, then recently sold (enum order), then the chosen sort.
  q = q.order("status");
  if (query.sort === "price_asc") q = q.order("price_paise", { ascending: true });
  else if (query.sort === "price_desc") q = q.order("price_paise", { ascending: false });
  else q = q.order("published_at", { ascending: false });

  const { data, count, error } = await q.order("id").range(0, query.limit - 1);
  logError("listProducts", error);
  return { products: toCards(data), total: count ?? 0 };
}

export type Facets = {
  sizes: string[];
  conditions: ProductCondition[];
  brands: string[];
  styles: { tag: string; label: string }[];
  priceRangeRupees: { min: number; max: number } | null;
};

/**
 * Filter options that actually have products in this scope (category or search query), so the
 * filter panel never offers a dead end.
 * TODO: move to a SQL function once the catalogue grows past a few thousand items.
 */
export async function getFacets(scope: {
  categoryIds: string[] | null;
  q: string;
}): Promise<Facets> {
  const empty: Facets = {
    sizes: [],
    conditions: [],
    brands: [],
    styles: [],
    priceRangeRupees: null,
  };
  const supabase = client();
  if (!supabase) return empty;

  let q = supabase
    .from("products")
    .select("tagged_size, brand, condition, style_tags, price_paise")
    .neq("status", "draft")
    .or(`status.neq.sold,sold_at.gt.${soldCutoffIso()}`);
  if (scope.categoryIds) q = q.in("category_id", scope.categoryIds);
  const tsQuery = toPrefixQuery(scope.q);
  if (tsQuery) q = q.textSearch("search", tsQuery, { config: "english" });

  const { data, error } = await q.limit(2000);
  logError("getFacets", error);
  if (!data || data.length === 0) return empty;

  const sizes = [...new Set(data.flatMap((p) => (p.tagged_size ? [p.tagged_size] : [])))].sort(
    compareSizes,
  );
  const presentConditions = new Set(data.map((p) => p.condition));
  const brands = [...new Set(data.flatMap((p) => (p.brand ? [p.brand] : [])))].sort((a, b) =>
    a.localeCompare(b),
  );
  const tags = new Set(data.flatMap((p) => p.style_tags));
  const known = new Set<string>(styleTags.map(([, tag]) => tag));
  const styles = [
    ...styleTags.filter(([, tag]) => tags.has(tag)).map(([label, tag]) => ({ tag, label })),
    ...[...tags].filter((t) => !known.has(t)).map((tag) => ({ tag, label: tag })),
  ];
  const prices = data.map((p) => p.price_paise);

  return {
    sizes,
    conditions: (Object.keys(conditionGrades) as ProductCondition[]).filter((c) =>
      presentConditions.has(c),
    ),
    brands,
    styles,
    priceRangeRupees: {
      min: Math.floor(Math.min(...prices) / 100),
      max: Math.ceil(Math.max(...prices) / 100),
    },
  };
}

export type SearchSuggestion = {
  slug: string;
  title: string;
  brand: string | null;
  pricePaise: number;
  imageUrl: string | null;
  sold: boolean;
};

/** Instant results for the header search box. */
export async function getSearchSuggestions(text: string, limit = 6): Promise<SearchSuggestion[]> {
  if (!toPrefixQuery(text)) return [];
  const { products } = await listProducts({
    q: text,
    categoryIds: null,
    sizes: [],
    conditions: [],
    brands: [],
    styles: [],
    minRupees: null,
    maxRupees: null,
    sort: "newest",
    limit,
  });
  return products.map((p) => ({
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    pricePaise: p.pricePaise,
    imageUrl: p.images[0]?.url ?? null,
    sold: p.status === "sold",
  }));
}

// ---------------------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------------------

const MEASUREMENT_KEYS = [
  "chest",
  "shoulder",
  "sleeve",
  "length",
  "waist",
  "hip",
  "inseam",
] as const;
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];
export type Measurements = Partial<Record<MeasurementKey, number>>;

export type ProductDetail = ProductCardData & {
  description: string;
  flaws: string | null;
  measurements: Measurements;
  styleTags: string[];
  categoryId: string;
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  drop: { name: string; slug: string } | null;
  soldAt: string | null;
};

function toMeasurements(value: unknown): Measurements {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const result: Measurements = {};
  for (const key of MEASUREMENT_KEYS) {
    const v: unknown = (value as Record<string, unknown>)[key];
    if (typeof v === "number" && v > 0) result[key] = v;
  }
  return result;
}

/**
 * A product by slug, or null. Sold items stay readable forever (their URL never 404s); drafts and
 * items in drops that aren't live yet are hidden by RLS and come back as null.
 * Wrapped in React cache(): the layout, metadata and page share one query per request.
 */
export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select(
      `${PRODUCT_CARD_COLUMNS}, description, flaws, measurements, style_tags, category_id, sold_at,
       category:categories(name, slug, parent_id),
       drop:drops(name, slug)`,
    )
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "product_images" })
    .maybeSingle();
  logError("getProductBySlug", error);
  if (!data) return null;

  const card = toCard(data);
  if (!card) return null;

  const parentId = data.category?.parent_id;
  const parent = parentId
    ? (await supabase.from("categories").select("name, slug").eq("id", parentId).maybeSingle()).data
    : null;

  return {
    ...card,
    description: data.description,
    flaws: data.flaws,
    measurements: toMeasurements(data.measurements),
    styleTags: data.style_tags,
    categoryId: data.category_id,
    category: data.category
      ? {
          name: data.category.name,
          slug: data.category.slug,
          parent: parent ? { name: parent.name, slug: parent.slug } : null,
        }
      : null,
    drop: data.drop ? { name: data.drop.name, slug: data.drop.slug } : null,
    soldAt: data.sold_at,
  };
});

/** "You may also like": buyable items from the same category or sharing a style tag. */
export async function getRelatedProducts(
  product: Pick<ProductDetail, "id" | "categoryId" | "styleTags">,
  limit = 8,
): Promise<ProductCardData[]> {
  const supabase = client();
  if (!supabase) return [];
  const tags = product.styleTags.filter((t) => /^[a-z0-9-]+$/.test(t));
  const match = tags.length
    ? `category_id.eq.${product.categoryId},style_tags.ov.{${tags.join(",")}}`
    : `category_id.eq.${product.categoryId}`;

  const { data, error } = await listedProducts(supabase)
    .in("status", ["available", "reserved"])
    .neq("id", product.id)
    .or(match)
    .order("published_at", { ascending: false })
    .limit(limit);
  logError("getRelatedProducts", error);
  return toCards(data);
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

/**
 * Fresh product data for cart lines, in the order given. Includes sold and held items (the cart
 * shows them as unavailable); drafts and hidden items are dropped by RLS.
 */
export async function getCartProducts(ids: string[]): Promise<ProductCardData[]> {
  const supabase = client();
  if (!supabase || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_COLUMNS)
    .in("id", ids)
    .neq("status", "draft")
    .order("sort_order", { referencedTable: "product_images" });
  logError("getCartProducts", error);
  const byId = new Map(toCards(data).map((p) => [p.id, p]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}
