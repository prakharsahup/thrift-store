import type { Metadata, Viewport } from "next";
import { Bungee, Instrument_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { motionInitScript } from "@/lib/motion/init-script";
import { site } from "@/lib/config/site";
import "./globals.css";

// next/font downloads these at build time and serves them from our own domain.
// Display: Bungee, a chunky caps-only face with rounded-square forms: the Drop Night poster voice
// for the logo, page headings and drop titles (see h1/h2 in globals.css). One weight.
const display = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
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
  themeColor: "#0b0b0b",
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
      </body>
    </html>
  );
}
