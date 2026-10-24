import type { MetadataRoute } from "next";
import { site } from "@/lib/config/site";

// Vercel sets VERCEL_ENV to "production" only on the production domain — preview/branch
// deployments and local dev get blocked so they never get indexed by mistake.
const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart", "/order", "/notify/confirm", "/dev"],
      },
    ],
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
