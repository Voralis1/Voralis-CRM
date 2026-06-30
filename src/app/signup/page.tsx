"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthSplit from "@/components/AuthSplit";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState<"affiliate" | "media_buyer">("affiliate");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pwd, role }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setErr(json.message ?? "Erreur");
    }
    setLoading(false);
    // Pas de connexion automatique : on renvoie vers la page de connexion.
    router.push("/login?registered=1");
  }

  return (
    <AuthSplit>
      <div>
        <div className="mb-8 lg:hidden">
          <div className="text-2xl font-extrabold tracking-[0.2em] text-ink">VORALIS</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">COD Enterprise</div>
        </div>

        <h1 className="text-2xl font-bold text-ink">Créer un compte</h1>
        <p className="mb-6 mt-1 text-sm text-ink-muted">Rejoignez la plateforme en tant que partenaire.</p>

        <label className="label">Type de compte</label>
        <select
          className="input mb-3"
          value={role}
          onChange={(e) => setRole(e.target.value as "affiliate" | "media_buyer")}
        >
          <option value="affiliate">Affilié</option>
          <option value="media_buyer">Acheteur d'espaces publicitaires</option>
        </select>

        <label className="label">Nom / Société</label>
        <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="label">Email</label>
        <input className="input mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">Mot de passe</label>
        <input
          className="input mb-4"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {err && <p className="mb-3 text-sm text-danger">{err}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </button>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Déjà inscrit ?{" "}
          <a className="font-medium text-accent hover:underline" href="/login">Se connecter</a>
        </p>
      </div>
    </AuthSplit>
  );
}
