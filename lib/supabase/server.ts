import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Supabase client for Server Components, server actions and route handlers.
 * Acts as the signed-in user, so RLS applies. Create one per request.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies. Safe to ignore: proxy.ts refreshes the session.
        }
      },
    },
  });
}

/**
 * Anonymous client with no cookies, for public catalogue reads (products, drops, banners).
 * Because it doesn't touch the request, pages using it can be statically cached and revalidated.
 * RLS applies exactly as for a signed-out visitor.
 */
export function createPublicClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createSupabaseClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
