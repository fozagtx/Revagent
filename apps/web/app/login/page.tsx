"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/pageHeader";
import { authedFetch } from "@/lib/utils";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get("next") || "/";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await authedFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, display_name: name || undefined }),
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Sign in failed (${r.status}).`);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page pt-28 pb-12 md:pt-32 md:pb-16 max-w-md space-y-7">
      <PageHeader
        title="Sign in"
        description="Use your email to access RevAgent. We'll create an account on first sign-in."
      />
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" required>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[rgba(0,37,97,0.12)] bg-white px-3 py-2 text-sm tracking-ui outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Display name" hint="Optional. Shown on shared pages.">
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[rgba(0,37,97,0.12)] bg-white px-3 py-2 text-sm tracking-ui outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Founder name"
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Signing in…" : "Continue"}
          </Button>
        </form>
      </Card>
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
