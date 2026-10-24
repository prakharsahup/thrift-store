import type { NextRequest } from "next/server";
import { setGeoCookie } from "@/lib/geo";
import { updateSession } from "@/lib/supabase/session";

// Next 16 renamed middleware → proxy. Refreshes the session and gates /admin (lib/supabase/session.ts),
// and remembers the visitor's country for display prices (lib/geo.ts).
export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  setGeoCookie(request, response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|placeholders/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|woff2?)$).*)",
  ],
};
