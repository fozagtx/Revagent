"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/pitch", label: "Pitch" },
  { href: "/call", label: "Call" },
  { href: "/audit", label: "Audit" },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="relative z-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-700"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-[1223px] items-center justify-between px-4 pt-5 pb-2 md:px-6">
        <Link
          href="/"
          className="font-serif text-[26px] leading-none text-navy md:text-[28px] rounded-md -mx-1 px-1"
          aria-label="RevAgent home"
        >
          RevAgent
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2.5 text-[15px] font-semibold tracking-ui transition",
                  "duration-charms ease-charms",
                  active
                    ? "text-navy"
                    : "text-neutral-600 hover:text-navy hover:bg-blue-700/[0.06]",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/audit"
            className="inline-flex h-10 items-center rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-5 text-sm font-semibold tracking-ui text-blue-700 transition duration-charms ease-charms hover:bg-blue-100/40"
          >
            Log in
          </Link>
          <Link
            href="/pitch"
            className="btn-cta inline-flex h-10 items-center rounded-2xl px-5 text-sm font-semibold tracking-ui transition duration-charms ease-charms"
          >
            Get started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 border border-[rgba(189,215,255,0.5)] text-navy"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          id="mobile-nav"
          className="md:hidden fade-in mx-4 mt-2 rounded-2xl border border-[rgba(189,215,255,0.5)] bg-white/95 p-2 shadow-lg backdrop-blur-md"
        >
          <ul className="flex flex-col">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center rounded-xl px-3 text-[15px] font-semibold tracking-ui",
                      active
                        ? "bg-blue-100 text-navy"
                        : "text-neutral-700 hover:bg-blue-100/50",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex gap-2 border-t border-[rgba(189,215,255,0.5)] pt-2">
            <Link
              href="/audit"
              className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-white text-sm font-semibold tracking-ui text-blue-700 border border-[rgba(0,37,97,0.08)]"
            >
              Log in
            </Link>
            <Link
              href="/pitch"
              className="btn-cta flex-1 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold tracking-ui"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
