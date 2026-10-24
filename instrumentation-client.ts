import * as Sentry from "@sentry/nextjs";

// Inert until SENTRY_DSN is set (Sentry.init with no dsn just disables the SDK — same
// feature-flag-by-env-var pattern as NEXT_PUBLIC_AUTH_GOOGLE_ENABLED elsewhere in this app).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // No session replay: thrift PDPs show customer addresses/order details we don't want recorded.
});
