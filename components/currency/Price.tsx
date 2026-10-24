"use client";

import { useCurrency } from "./CurrencyProvider";

type Props = { amountPaise: number; className?: string };

// A price in the visitor's currency. Safe to drop into Server Components. data-price lets the
// head script hide it until the currency is known (lib/currency/init-script.ts).
export function Price({ amountPaise, className }: Props) {
  const { format } = useCurrency();
  return (
    <span data-price className={className}>
      {format(amountPaise)}
    </span>
  );
}
