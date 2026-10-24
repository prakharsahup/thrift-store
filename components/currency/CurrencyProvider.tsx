"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  currencyForCountry,
  type DisplayCurrency,
  type ExchangeRates,
} from "@/lib/config/currency";
import { GEO_COOKIE } from "@/lib/geo";
import { formatConverted } from "@/lib/utils/money";

type CurrencyContextValue = {
  /** The visitor's country (ISO code), or null when unknown (treated as India). */
  country: string | null;
  currency: DisplayCurrency;
  rates: ExchangeRates;
  /** Paise → a price in the visitor's currency. */
  format: (amountPaise: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const cookiePattern = new RegExp(`(?:^|; )${GEO_COOKIE}=([A-Z]{2})`);

function readCountry(): string | null {
  return cookiePattern.exec(document.cookie)?.[1] ?? null;
}

// The cookie is set by the proxy before the page loads and doesn't change while it's open.
const subscribe = () => () => {};

type Props = { rates: ExchangeRates; children: React.ReactNode };

// Pages are cached and identical for everyone, so the server renders rupees and the browser
// switches to the visitor's currency on hydration. lib/currency/init-script.ts hides prices until
// then, so visitors abroad don't see rupees flash first.
export function CurrencyProvider({ rates, children }: Props) {
  const country = useSyncExternalStore(subscribe, readCountry, () => null);
  const currency = currencyForCountry(country);

  useEffect(() => {
    // The first (hydration) render still uses the server's null; wait for the real country.
    if (country === readCountry()) document.documentElement.classList.remove("currency-pending");
  }, [country]);

  const format = useCallback(
    (amountPaise: number) => formatConverted(amountPaise, currency, rates[currency]),
    [currency, rates],
  );
  const value = useMemo(
    () => ({ country, currency, rates, format }),
    [country, currency, rates, format],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return value;
}
