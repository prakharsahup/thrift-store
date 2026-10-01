import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next 16 renamed middleware → proxy. Admin role-gating is added here in Phase 8.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|placeholders/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|woff2?)$).*)",
  ],
};
