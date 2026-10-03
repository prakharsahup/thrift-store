import type { Database as Generated } from "./database.types";

export type { Json } from "./database.types";

// The generated types, with one correction. Postgres can't mark view columns NOT NULL, so the
// generator types every column of storefront_products / listed_products (and search_products,
// which returns listed_products rows) as nullable. Those views select straight from products, so
// their columns are exactly as nullable as the table's. Import Database from here, not from
// database.types.ts.

type Public = Generated["public"];

/** A storefront_products / listed_products row: products minus the private reservation columns. */
export type StorefrontProductRow = Omit<
  Public["Tables"]["products"]["Row"],
  "reserved_by" | "reserved_order_id"
> & { effective_status: Public["Enums"]["product_status"] };

type StorefrontView<V extends "storefront_products" | "listed_products"> = Omit<
  Public["Views"][V],
  "Row"
> & { Row: StorefrontProductRow };

export type Database = Omit<Generated, "public"> & {
  public: Omit<Public, "Views" | "Functions"> & {
    Views: Omit<Public["Views"], "storefront_products" | "listed_products"> & {
      storefront_products: StorefrontView<"storefront_products">;
      listed_products: StorefrontView<"listed_products">;
    };
    Functions: Omit<Public["Functions"], "search_products"> & {
      search_products: Omit<Public["Functions"]["search_products"], "Returns"> & {
        Returns: StorefrontProductRow[];
      };
    };
  };
};
