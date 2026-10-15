import type { NextConfig } from "next";

// Uploaded images are served from Supabase Storage's public bucket (supabase/migrations/…_admin.sql).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholder product/banner images (CLAUDE.md §2).
      { protocol: "https", hostname: "placehold.co" },
      // Vendoo-imported catalogue photos, hotlinked for now (CSV import, 2026-10-14).
      { protocol: "https", hostname: "images.vendoo.co" },
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              port: supabaseUrl.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  // Baseline security headers ("reasonable security safeguards", DPDP Act s. 8(5)). No CSP yet:
  // Razorpay's checkout script and frames need a carefully tested allow-list (docs/COMPLIANCE.md).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Browsers ignore HSTS on plain-http localhost, so this is safe in development.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
