import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "./types";

/** Refreshes the Supabase auth session cookie on each request. Called from proxy.ts. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Let the app run before Supabase is configured (Phase 0/1).
  if (!hasSupabaseEnv()) return response;

  const { url, anonKey } = getSupabasePublicEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // No-cache headers so a CDN never serves one user's session cookie to another.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Validates the JWT and refreshes it if needed. Don't add logic between client creation and this call.
  const { data } = await supabase.auth.getClaims();

  // /admin, gate 1 of 3 (then the admin layout, then RLS). Signed-out visitors go to sign-in;
  // signed-in non-admins get a plain 404, so the admin area doesn't advertise itself.
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    if (!data?.claims) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", request.nextUrl.pathname);
      return withCookies(NextResponse.redirect(login), response);
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin !== true) {
      return withCookies(
        NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 }),
        response,
      );
    }
  }

  return response;
}

/** Carries refreshed session cookies over to a redirect/rewrite response. */
function withCookies(target: NextResponse, source: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}
