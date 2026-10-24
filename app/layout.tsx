import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { motionInitScript } from "@/lib/motion/init-script";
import { site } from "@/lib/config/site";
import "./globals.css";

// next/font downloads these at build time and serves them from our own domain.
// Display: Bricolage Grotesque, a grotesk with ink traps and real quirks. The opsz and wdth axes
// let big headings go tighter and narrower (see h1/h2 in globals.css).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

// Body / UI: Instrument Sans, a crisp, slightly narrow grotesk that stays legible at 12–14px.
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
};

export const viewport: Viewport = {
  // Matches --color-bg in app/globals.css (metadata can't read CSS variables).
  themeColor: "#100d16",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script may add `no-motion` to <html> before React hydrates.
    <html lang="en-IN" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <MotionProvider>{children}</MotionProvider>
        {/* No-ops when not deployed on Vercel or when analytics isn't enabled for the project. */}
        <Analytics />
      </body>
    </html>
  );
}
