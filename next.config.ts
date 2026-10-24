import type { NextConfig } from "next";
// @sentry/nextjs 11.x moved this to a subpath export.
import { withSentryConfig } from "@sentry/nextjs/config";

// Uploaded images are served from Supabase Storage's public bucket (supabase/migrations/…_admin.sql).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholder product/banner images (CLAUDE.md §2).
      { protocol: "https", hostname: "placehold.co" },
      // Vendoo-imported catalogue photos, hotlinked for now (CSV import, 2026-10-14).
      { protocol: "https", hostname: "images.vendoo.co" },
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              port: supabaseUrl.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  // Baseline security headers ("reasonable security safeguards", DPDP Act s. 8(5)).
  async headers() {
    const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : "";
    // Allow-list built from Razorpay's documented Checkout domains (docs/COMPLIANCE.md §9).
    // Written from their docs, not yet exercised against a live Checkout modal — re-test with
    // real test-mode keys before launch, and watch the browser console for new violations.
    const csp = [
      "default-src 'self'",
      // 'unsafe-eval' is only needed for Next.js dev-mode HMR; dropped in production.
      `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${
        process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"
      }`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: https://placehold.co https://images.vendoo.co https://*.razorpay.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
      "font-src 'self' data:",
      `connect-src 'self' https://*.razorpay.com${supabaseOrigin ? ` ${supabaseOrigin} wss://${supabaseOrigin.replace(/^https?:\/\//, "")}` : ""}`,
      "frame-src https://checkout.razorpay.com https://api.razorpay.com",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          // Browsers ignore HSTS on plain-http localhost, so this is safe in development.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Events are tunnelled through our own domain (same-origin), so Sentry's ingest domain never
  // needs to go in the CSP connect-src above, and ad blockers that target Sentry's own domain
  // can't drop error reports either.
  tunnelRoute: "/monitoring",
  // No org/project/authToken set: source maps simply aren't uploaded until those are configured
  // (SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT) — the build doesn't fail without them.
});
