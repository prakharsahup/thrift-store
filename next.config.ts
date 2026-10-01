import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder product/banner images (CLAUDE.md §2). Supabase Storage is added in Phase 3.
    remotePatterns: [{ protocol: "https", hostname: "placehold.co" }],
  },
};

export default nextConfig;
