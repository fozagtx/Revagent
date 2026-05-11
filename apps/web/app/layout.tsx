import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RevAgent",
  description: "3 AI agents that fix every founder's pitch, discovery, and win-loss workflow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-800">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-mono text-lg tracking-tight text-slate-100">
              <span className="text-brand-accent">rev</span>agent
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/pitch" className="text-slate-300 hover:text-slate-100">Pitch</Link>
              <Link href="/call" className="text-slate-300 hover:text-slate-100">Call</Link>
              <Link href="/audit" className="text-slate-300 hover:text-slate-100">Audit</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">{children}</main>
        <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          RevAgent · MIT · AI Agent Olympics @ Milan AI Week 2026
        </footer>
      </body>
    </html>
  );
}
