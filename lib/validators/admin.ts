import { z } from "zod";
import { selectableConditions } from "@/lib/config/conditions";
import { rupeesToPaise } from "@/lib/utils/money";
import { fromIstInputValue } from "@/lib/utils/datetime";
import { slugify } from "@/lib/utils/slug";

// Admin form schemas. They parse FormData values (always strings) into what the database
// expects, and mirror the table checks in supabase/migrations so errors show next to the field
// instead of as a failed insert.

const text = (max: number, message = `Keep it under ${max} characters.`) =>
  z.string().trim().max(max, message);
const requiredText = (max: number, label: string) => text(max).min(1, `Enter ${label}.`);
/** Empty → null. */
const optionalText = (max: number) => text(max).transform((v) => v || null);

/** A checkbox: present ("on") when ticked, absent otherwise. */
const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");
/** Empty → derive from another field later. */
const optionalSlug = z.union([z.literal(""), slug]).transform((v) => v || null);

const optionalUuid = z.union([z.literal(""), z.uuid()]).transform((v) => v || null);

/** "499" or "499.50" rupees → integer paise. */
const rupees = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, `Enter ${label} in rupees, like 499.`)
    .transform((v) => rupeesToPaise(Number(v)));
const optionalRupees = (label: string) =>
  z.union([z.literal(""), rupees(label)]).transform((v) => (v === "" ? null : v));

const optionalPositiveInt = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d*$/, `${label} must be a whole number.`)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || v > 0, `${label} must be more than 0.`);

const istDateTime = (label: string) =>
  z.string().transform((v, ctx) => {
    const iso = fromIstInputValue(v);
    if (!iso) ctx.addIssue({ code: "custom", message: `Choose ${label}.` });
    return iso ?? "";
  });
const optionalIstDateTime = z.string().transform((v) => (v ? fromIstInputValue(v) : null));

const imageUrl = z.url({ protocol: /^https?$/, message: "Upload an image or paste its URL." });
const optionalImageUrl = z.union([z.literal(""), imageUrl]).transform((v) => v || null);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const measurementKeys = [
  "chest",
  "length",
  "shoulder",
  "sleeve",
  "waist",
  "hip",
  "inseam",
] as const;

/** "" or "2026-10-19" (a date input), not in the future. */
const optionalPastDate = z
  .union([z.literal(""), z.iso.date("Choose a date.")])
  .transform((v) => v || null)
  .refine(
    (v) =>
      v === null ||
      v <= new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()),
    "That date is in the future.",
  );

/**
 * What a piece cost to acquire (product_costs). Admin-only: it never reaches the storefront.
 * Every field is optional; a piece with no cost is left out of profit figures.
 */
export const productCostSchema = z.object({
  cost: optionalRupees("the cost"),
  cost_source: optionalText(120),
  acquired_on: optionalPastDate,
});

export type ProductCost = z.infer<typeof productCostSchema>;

/** The product_costs row for a piece, or null when nothing was entered (delete any old row). */
export function productCostRow(productId: string, cost: ProductCost) {
  if (cost.cost === null && cost.cost_source === null && cost.acquired_on === null) return null;
  return {
    product_id: productId,
    cost_paise: cost.cost,
    source: cost.cost_source,
    acquired_on: cost.acquired_on,
  };
}

const measurement = z
  .string()
  .trim()
  .regex(/^(\d{1,3}(\.\d)?)?$/, "Centimetres, like 56 or 56.5.")
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (v > 0 && v <= 300), "Between 0 and 300 cm.");

export const productFormSchema = z
  .object({
    title: requiredText(200, "a title"),
    slug: optionalSlug,
    description: text(5000),
    brand: optionalText(80),
    category_id: z.uuid("Choose a category."),
    drop_id: optionalUuid,
    gender: z.enum(["men", "women", "unisex"], "Choose who it's for."),
    tagged_size: optionalText(20),
    condition: z.enum(selectableConditions, "Choose a condition."),
    flaws: optionalText(1000),
    country_of_origin: optionalText(60),
    style_tags: z
      .string()
      .transform((v) => [
        ...new Set(
          v
            .split(",")
            .map((t) => slugify(t))
            .filter(Boolean),
        ),
      ])
      .refine((tags) => tags.length <= 10, "Ten tags at most."),
    price: rupees("the price"),
    original_price: optionalRupees("the est. retail price"),
    /** "reserved" means "leave the status alone" (a shopper is checking out). */
    status: z.enum(["draft", "available", "sold", "reserved"]),
    // Measurements, one field per key in measurementKeys.
    m_chest: measurement,
    m_length: measurement,
    m_shoulder: measurement,
    m_sleeve: measurement,
    m_waist: measurement,
    m_hip: measurement,
    m_inseam: measurement,
  })
  .extend(productCostSchema.shape)
  .refine((p) => p.original_price === null || p.original_price > p.price, {
    path: ["original_price"],
    message: "Est. retail must be more than the price.",
  });

export type ProductForm = z.infer<typeof productFormSchema>;

/** The measurements object for the database: only the keys that were filled in. */
export function measurementsFrom(form: ProductForm): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of measurementKeys) {
    const value = form[`m_${key}`];
    if (value !== null) result[key] = value;
  }
  return result;
}

export const imageAltSchema = text(200).min(1, "Describe the photo for people who can't see it.");

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orderUpdateSchema = z.object({
  status: z.enum(["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]),
  tracking_url: z
    .union([
      z.literal(""),
      z.url({ protocol: /^https?$/, message: "Paste the full tracking link." }),
    ])
    .transform((v) => v || null),
});

// ---------------------------------------------------------------------------
// Drops, categories, banners, coupons
// ---------------------------------------------------------------------------

export const dropFormSchema = z.object({
  name: requiredText(120, "a name"),
  slug: optionalSlug,
  description: text(2000),
  banner_url: optionalImageUrl,
  go_live_at: istDateTime("when it goes live"),
  is_published: checkbox,
});

export const categoryFormSchema = z.object({
  name: requiredText(80, "a name"),
  slug: optionalSlug,
  parent_id: optionalUuid,
  gender: z.enum(["men", "women", "unisex"], "Choose who it's for."),
  image_url: optionalImageUrl,
  sort_order: z.coerce.number().int("Whole numbers only.").min(0).max(9999),
});

export const bannerFormSchema = z
  .object({
    title: requiredText(120, "a title"),
    subtitle: optionalText(200),
    image_url: imageUrl,
    image_alt: requiredText(200, "a description of the image"),
    link_url: z
      .string()
      .trim()
      .regex(
        /^(\/|https?:\/\/)\S*$/,
        "A page on this site (/c/men-jackets) or a full https:// link.",
      ),
    cta_label: requiredText(40, "the button text"),
    sort_order: z.coerce.number().int("Whole numbers only.").min(0).max(9999),
    is_active: checkbox,
    starts_at: optionalIstDateTime,
    ends_at: optionalIstDateTime,
  })
  .refine((b) => !b.starts_at || !b.ends_at || b.ends_at > b.starts_at, {
    path: ["ends_at"],
    message: "The end must be after the start.",
  });

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, "3–20 letters and numbers, like WELCOME10."),
    type: z.enum(["percent", "flat"]),
    /** Percent (1–100) or rupees, depending on type. */
    value: z
      .string()
      .trim()
      .regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a number."),
    min_order: optionalRupees("the minimum order"),
    max_uses: optionalPositiveInt("Max uses"),
    expires_at: optionalIstDateTime,
    active: checkbox,
  })
  .transform((c, ctx) => {
    const amount = Number(c.value);
    if (c.type === "percent" && (!Number.isInteger(amount) || amount < 1 || amount > 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "A whole percent from 1 to 100." });
    }
    if (c.type === "flat" && amount <= 0) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "More than ₹0." });
    }
    return {
      code: c.code,
      type: c.type,
      value: c.type === "percent" ? amount : rupeesToPaise(amount),
      min_order_paise: c.min_order ?? 0,
      max_uses: c.max_uses,
      expires_at: c.expires_at,
      active: c.active,
    };
  });
