// One cart line = one unique product (thrift: there's never a quantity).
// Prices here are for display only. Checkout re-reads every price from the database.
export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  brand: string | null;
  taggedSize: string | null;
  pricePaise: number;
  imageUrl: string | null;
  /** Expired holds read as "available". Sold or held items can't be checked out. */
  status: "available" | "reserved" | "sold";
};

/** What every server action returns: data, or a message that is safe to show the user. */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; message: string; needsLogin?: boolean };
