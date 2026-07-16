"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import AuthSplit from "@/components/AuthSplit";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const registered = params.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submit() {
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error) return setErr(error.message);
    router.push(next);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Log in</h1>
      <p className="mb-6 mt-1 text-sm text-ink-muted">Access your VORALIS workspace.</p>

      {registered && (
        <p className="alert alert-success mb-4">
          Account created successfully. Log in to continue.
        </p>
      )}

      <label className="label">Email</label>
      <input
        className="input mb-3"
        style={{ fontSize: 16 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      <label className="label">Password</label>
      <input
        className="input mb-4"
        style={{ fontSize: 16 }}
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        type="password"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {err && <p className="mb-3 text-sm text-danger">{err}</p>}

      <button className="btn-primary w-full" onClick={submit} disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Don't have an account yet?{" "}
        <Link className="font-medium text-accent hover:underline" href="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthSplit>
      <Suspense fallback={<div className="text-ink-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </AuthSplit>
  );
}
