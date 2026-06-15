"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pwd }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setErr(json.message ?? "Erreur");
    }
    await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    router.push("/panel/settings");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-deep p-4">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-1 text-2xl font-extrabold tracking-[0.2em] text-brand-dark">VORALIS</div>
        <p className="mb-6 text-sm text-slate-500">Inscription webmaster</p>

        <label className="label">Nom / Société</label>
        <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="label">Email</label>
        <input className="input mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">Mot de passe</label>
        <input className="input mb-4" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />

        {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          Déjà inscrit ? <a className="font-medium text-brand-light" href="/login">Se connecter</a>
        </p>
      </div>
    </div>
  );
}
