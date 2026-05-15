import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, Space_Mono } from "next/font/google";
import { SiteHeader } from "@/components/siteHeader";
import { SiteFooter } from "@/components/siteFooter";

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RevAgent — Sales intelligence for early-stage founders",
    template: "%s · RevAgent",
  },
  description:
    "Three coordinated AI agents that fix pitch decks, live discovery calls, and post-deal pattern extraction.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-sans tracking-ui text-navy antialiased">
        <SiteHeader />

        <main
          id="main-content"
          tabIndex={-1}
          className="relative outline-none"
        >
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
