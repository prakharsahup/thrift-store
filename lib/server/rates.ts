import "server-only";
import { z } from "zod";
import { buildRates, fallbackRates, type ExchangeRates } from "@/lib/config/currency";

// Daily exchange rates from Frankfurter (frankfurter.dev: free, no API key, European Central Bank
// reference rates). Cached for 12 hours, so pages stay statically cacheable. If the feed is down
// we use the fallback table in lib/config/currency.ts and prices still render.

const RATES_URL = "https://api.frankfurter.dev/v1/latest?base=INR";

const ratesResponseSchema = z.object({ rates: z.record(z.string(), z.number().positive()) });

/** Units of each display currency per ₹1. */
export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch(RATES_URL, { next: { revalidate: 43_200 } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { rates } = ratesResponseSchema.parse(await response.json());
    return buildRates(rates);
  } catch (error) {
    console.error("[rates] using fallback exchange rates:", error);
    return fallbackRates;
  }
}
