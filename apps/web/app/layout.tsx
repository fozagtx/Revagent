import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, Space_Mono } from "next/font/google";
import { SiteHeader } from "@/components/siteHeader";

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
        <div className="relative">
          {/* Decorative ambient orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-orb opacity-80"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-40 -right-40 h-[420px] w-[420px] rounded-full bg-orb opacity-70"
          />

          <SiteHeader />

          <main
            id="main-content"
            tabIndex={-1}
            className="relative z-10 mx-auto w-full max-w-[1223px] px-4 py-8 md:px-6 md:py-12 outline-none"
          >
            {children}
          </main>

          <footer className="relative z-10 mx-auto max-w-[1223px] px-6 py-8 mt-10 border-t border-[rgba(189,215,255,0.5)]">
            <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
              <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                RevAgent · MIT
              </p>
              <p className="text-xs text-neutral-500 tracking-ui">
                Built for the AI Agent Olympics · Milan AI Week 2026
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
