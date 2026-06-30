"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      {/* Logo (visible surtout sur mobile, où le panneau gauche est masqué) */}
      <div className="mb-8 lg:hidden">
        <div className="text-2xl font-extrabold tracking-[0.2em] text-ink">VORALIS</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">COD Enterprise</div>
      </div>

      <h1 className="text-2xl font-bold text-ink">Connexion</h1>
      <p className="mb-6 mt-1 text-sm text-ink-muted">Accédez à votre espace VORALIS.</p>

      {registered && (
        <p className="alert alert-success mb-4">
          Compte créé avec succès. Connecte-toi pour continuer.
        </p>
      )}

      <label className="label">Email</label>
      <input className="input mb-3" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      <label className="label">Mot de passe</label>
      <input
        className="input mb-4"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        type="password"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {err && <p className="mb-3 text-sm text-danger">{err}</p>}

      <button className="btn-primary w-full" onClick={submit} disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <a className="font-medium text-accent hover:underline" href="/signup">S'inscrire</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthSplit>
      <Suspense fallback={<div className="text-ink-muted">Chargement…</div>}>
        <LoginForm />
      </Suspense>
    </AuthSplit>
  );
}
