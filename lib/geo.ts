import type { NextRequest, NextResponse } from "next/server";

// The visitor's country, for showing prices in their currency. Vercel adds the
// x-vercel-ip-country header to every request; the proxy copies it into a cookie the browser can
// read, because the pages themselves are cached and the same for everyone.
// Locally there's no header: set DEV_GEO_COUNTRY (e.g. "US") in .env.local to try another country.

export const GEO_COOKIE = "geo_country";

export function setGeoCookie(request: NextRequest, response: NextResponse): void {
  const header =
    request.headers.get("x-vercel-ip-country") ??
    (process.env.NODE_ENV === "production" ? null : (process.env.DEV_GEO_COUNTRY ?? null));
  const country = header?.toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country)) return;
  if (request.cookies.get(GEO_COOKIE)?.value === country) return;
  response.cookies.set(GEO_COOKIE, country, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
