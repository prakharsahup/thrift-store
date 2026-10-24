"use client";

import { formatMoney } from "@/lib/utils/money";
import { useCurrency } from "./CurrencyProvider";

type Props = { amountPaise: number; className?: string };

// The line under a product's price. Abroad, it says the price is a converted estimate.
export function PriceNote({ amountPaise, className }: Props) {
  const { currency } = useCurrency();
  return (
    <p className={className}>
      {currency === "INR"
        ? "Inclusive of all taxes."
        : `Approximate, converted from ${formatMoney(amountPaise)}. The exact amount is shown at checkout; any import duties are extra.`}
    </p>
  );
}
