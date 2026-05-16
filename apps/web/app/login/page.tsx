"use client";
import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/pageHeader";
import { authedFetch } from "@/lib/utils";

function slugifyEmail(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "founder"}@local.revagent`;
}

function fireConfetti() {
  const burst = (opts: confetti.Options) =>
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      ticks: 200,
      ...opts,
    });
  burst({ origin: { x: 0.2, y: 0.6 }, angle: 60 });
  burst({ origin: { x: 0.8, y: 0.6 }, angle: 120 });
  setTimeout(() => burst({ origin: { x: 0.5, y: 0.4 }, particleCount: 120, spread: 100 }), 200);
}

function LoginInner() {
  const search = useSearchParams();
  // After sign-in, default to the pitch workspace - the main "do something" view.
  // Honors ?next= if middleware bounced the user from a specific protected route.
  const next = search?.get("next") || "/pitch";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (loading || success) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tell us your name.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await authedFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: slugifyEmail(trimmed),
          display_name: trimmed,
        }),
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Sign in failed (${r.status}).`);
        setLoading(false);
        return;
      }
      setSuccess(trimmed);
      fireConfetti();
      // Full-page navigation guarantees the new session cookie is picked up
      // by middleware and SSR data fetches.
      setTimeout(() => {
        window.location.href = next;
      }, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div className="container-page pt-10 pb-12 md:pt-14 md:pb-16 max-w-md space-y-7">
      <PageHeader
        title="Welcome"
        description="Tell us your name to get started. We'll spin up a workspace just for you."
      />
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Your name" required>
            <input
              type="text"
              autoComplete="name"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || !!success}
              className="w-full rounded-xl border border-[rgba(0,37,97,0.12)] bg-white px-3 py-2 text-sm tracking-ui outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              placeholder="Ada Lovelace"
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading} disabled={!!success} className="w-full">
            {success ? "You're in" : loading ? "Signing in…" : "Continue"}
          </Button>
        </form>
      </Card>

      {success && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/40 backdrop-blur-sm fade-in"
        >
          <div className="rise-in mx-4 max-w-sm rounded-3xl border border-[rgba(189,215,255,0.6)] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-navy">Welcome, {success}!</h2>
            <p className="mt-2 text-sm text-neutral-600">Spinning up your workspace…</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
