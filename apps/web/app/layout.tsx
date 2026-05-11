import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Instrument_Sans, Instrument_Serif, Space_Mono } from "next/font/google";

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
  title: "RevAgent",
  description: "3 AI agents that fix every founder's pitch, discovery, and win-loss workflow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans tracking-ui text-navy">
        <div className="relative">
          {/* Decorative ambient orbs */}
          <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-orb opacity-80" />
          <div className="pointer-events-none absolute top-40 -right-40 w-[420px] h-[420px] rounded-full bg-orb opacity-70" />

          <header className="relative z-50">
            <div className="mx-auto max-w-[1223px] px-6 pt-5 pb-2 flex items-center justify-between">
              <Link href="/" className="font-serif text-[28px] leading-none text-navy">
                RevAgent
              </Link>
              <nav className="flex items-center gap-1">
                <NavLink href="/pitch">Pitch</NavLink>
                <NavLink href="/call">Call</NavLink>
                <NavLink href="/audit">Audit</NavLink>
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  href="/audit"
                  className="rounded-2xl h-11 px-6 inline-flex items-center font-semibold text-sm tracking-ui text-blue-700 bg-white border border-[rgba(0,37,97,0.06)] hover:bg-blue-100/40 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/pitch"
                  className="btn-cta rounded-2xl h-11 px-6 inline-flex items-center font-semibold text-sm tracking-ui transition"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </header>

          <main className="relative z-10 mx-auto max-w-[1223px] w-full px-6 py-10">{children}</main>

          <footer className="relative z-10 mx-auto max-w-[1223px] px-6 py-6 text-center text-xs text-neutral-500">
            RevAgent · MIT · AI Agent Olympics @ Milan AI Week 2026
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-3 text-[16px] tracking-ui font-semibold text-neutral-600 hover:text-navy hover:bg-blue-700/10 transition"
    >
      {children}
    </Link>
  );
}
