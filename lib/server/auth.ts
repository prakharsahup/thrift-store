import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user (verified with the auth server), or null. */
export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/** For account pages: the signed-in user, or a redirect to /login that comes back to `next`. */
export async function requireUser(next: string) {
  const { supabase, user } = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

/**
 * For /admin pages and admin server actions (gate 2 of 3 — the proxy checked first, RLS checks
 * last): the signed-in admin, or a 404 for anyone else. Returns the user's own client, so every
 * admin query still goes through RLS (is_admin()).
 */
export async function requireAdmin() {
  const { supabase, user } = await getUser();
  if (!user) notFound();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();
  return { supabase, user };
}
