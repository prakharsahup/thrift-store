import { NextResponse, type NextRequest } from "next/server";
import { getSearchSuggestions } from "@/lib/server/catalogue";

// Instant results for the header search box: GET /api/search?q=denim → up to 6 products.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await getSearchSuggestions(q);
  return NextResponse.json(
    { results },
    // Short shared cache: identical queries from many visitors don't each hit the database.
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
