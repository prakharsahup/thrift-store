// Single source of truth for the shipping rule (placeholder values — owner to confirm).
export const shipping = {
  flatPaise: 7900, // ₹79
  freeAbovePaise: 99900, // free on orders of ₹999 and above
} as const;

/** Shipping charge in paise for a given subtotal in paise. */
export function shippingFor(subtotalPaise: number): number {
  return subtotalPaise >= shipping.freeAbovePaise ? 0 : shipping.flatPaise;
}
