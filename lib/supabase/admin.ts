import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Service-role client that BYPASSES RLS. Server-only: use it for trusted work such as
 * webhooks and order finalisation, never for anything a user could steer directly.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only env var).");
  }
  const { url } = getSupabasePublicEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
