// Home page content that isn't in the database. Placeholder copy — the owner can rewrite freely.

/** Category tiles, in display order. Slugs must exist in `categories`. */
export const featuredCategorySlugs = [
  "men",
  "women",
  "unisex",
  "women-dresses",
  "men-jeans",
  "unisex-jackets",
] as const;

/** The "Under $…" rail. */
export const stealsMaxPaise = 49900;

/** StackCards story section. */
export const storyCards = [
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
    body: "When it's gone, it's gone. Save a piece to your wishlist and we'll email you if it ever comes back.",
  },
] as const;
