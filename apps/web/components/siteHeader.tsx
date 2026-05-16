"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, authedFetch } from "@/lib/utils";

const NAV = [
  { href: "/pitch", label: "Pitch" },
  { href: "/call", label: "Call" },
  { href: "/audit", label: "Audit" },
];

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

interface Me {
  founder_id: string;
  email: string;
  display_name: string | null;
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [me, setMe] = React.useState<Me | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (AUTH_DISABLED) {
      setLoaded(true);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const r = await authedFetch("/api/auth/me");
        if (alive) setMe(r.ok ? ((await r.json()) as Me) : null);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    await authedFetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative z-40">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-700"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-[1223px] items-center justify-between gap-6 px-4 pt-5 pb-3 md:px-6">
        <Link
          href="/"
          className="font-serif text-[24px] leading-none text-navy rounded-md -mx-1 px-1 md:text-[26px]"
          aria-label="RevAgent home"
        >
          RevAgent
        </Link>

        {(AUTH_DISABLED || me) && (
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-1 rounded-full border border-[rgba(189,215,255,0.6)] bg-white/80 backdrop-blur-md px-1.5 py-1.5 shadow-sm"
          >
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[14px] font-semibold tracking-ui transition",
                    "duration-charms ease-charms",
                    active
                      ? "bg-navy text-white"
                      : "text-neutral-600 hover:text-navy hover:bg-blue-700/[0.06]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="hidden md:flex items-center gap-2.5">
          {AUTH_DISABLED || !loaded ? null : me ? (
            <>
              <UserAvatar
                name={me.display_name || me.email}
                title={me.display_name || me.email}
              />
              <span className="font-semibold tracking-ui text-sm text-navy truncate max-w-[180px]">
                {me.display_name || me.email.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="ml-1 inline-flex h-10 items-center rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-4 text-sm font-semibold tracking-ui text-blue-700 transition-colors duration-charms ease-charms hover:bg-blue-100/40 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-cta inline-flex h-10 items-center rounded-2xl px-5 text-sm font-semibold tracking-ui transition duration-charms ease-charms"
            >
              Sign in
            </Link>
          )}
        </div>

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

      {open && (
        <div
          id="mobile-nav"
          className="md:hidden fade-in mx-4 mt-2 rounded-2xl border border-[rgba(189,215,255,0.5)] bg-white/95 p-2 shadow-lg backdrop-blur-md"
        >
          {(AUTH_DISABLED || me) && (
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
          )}
          {!AUTH_DISABLED && (
            <div className="mt-2 flex gap-2 border-t border-[rgba(189,215,255,0.5)] pt-2">
              {!loaded ? null : me ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-white text-sm font-semibold tracking-ui text-blue-700 border border-[rgba(0,37,97,0.08)]"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="btn-cta flex-1 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold tracking-ui"
                >
                  Sign in
                </Link>
              )}
            </div>
          )}
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

function UserAvatar({ name, title }: { name: string; title: string }) {
  const initials = computeInitials(name);
  const tintIdx = hashTint(name);
  return (
    <span
      aria-label={`Signed in as ${name}`}
      title={title}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-[12px] font-bold tracking-wider shadow-sm ring-2 ring-white",
        AVATAR_TINTS[tintIdx],
      )}
    >
      {initials}
    </span>
  );
}

// Six brand-consistent gradients. Picked deterministically by name hash so the
// same user always gets the same color across sessions.
const AVATAR_TINTS = [
  "from-blue-600 to-blue-800",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
] as const;

function computeInitials(raw: string): string {
  // Drop the email domain if present
  const base = raw.includes("@") ? raw.split("@")[0]! : raw;
  // Split on spaces, dashes, dots, underscores
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const word = parts[0]!;
    // Two-letter: first + last char of the single word, both uppercase
    return (word[0]! + (word[word.length - 1] ?? "")).toUpperCase();
  }
  // Multi-word: first letter of first + first letter of last
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function hashTint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % AVATAR_TINTS.length;
}
