import * as Sentry from "@sentry/nextjs";

// Server and edge runtimes share one init call; Next picks which `NEXT_RUNTIME` applies.
// Inert until SENTRY_DSN is set, same as instrumentation-client.ts.
export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
  });
}

export const onRequestError = Sentry.captureRequestError;
