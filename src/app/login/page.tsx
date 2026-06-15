"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
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
    <div className="card w-full max-w-sm p-7">
      <div className="mb-1 text-2xl font-extrabold tracking-[0.2em] text-brand-dark">VORALIS</div>
      <p className="mb-6 text-sm text-slate-500">Accès CRM</p>

      <label className="label">Email</label>
      <input className="input mb-3" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      <label className="label">Mot de passe</label>
      <input className="input mb-4" value={pwd} onChange={(e) => setPwd(e.target.value)} type="password"
             onKeyDown={(e) => e.key === "Enter" && submit()} />

      {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}

      <button className="btn-primary w-full" onClick={submit} disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="mt-5 text-center text-sm text-slate-500">
        Webmaster sans compte ?{" "}
        <a className="font-medium text-brand-light" href="/signup">S'inscrire</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-deep p-4">
      <Suspense fallback={<div className="text-slate-300">Chargement…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
