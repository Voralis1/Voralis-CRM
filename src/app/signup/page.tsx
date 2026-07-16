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
      return setErr(json.message ?? "Error");
    }
    setLoading(false);
    // Pas de connexion automatique : on renvoie vers la page de connexion.
    router.push("/login?registered=1");
  }

  return (
    <AuthSplit>
      <div>
        <h1 className="text-2xl font-bold text-ink">Create an account</h1>
        <p className="mb-6 mt-1 text-sm text-ink-muted">Join the platform as a partner.</p>

        <label className="label">Account type</label>
        <select
          className="input mb-3"
          style={{ fontSize: 16 }}
          value={role}
          onChange={(e) => setRole(e.target.value as "affiliate" | "media_buyer")}
        >
          <option value="affiliate">Affiliate</option>
          <option value="media_buyer">Media buyer</option>
        </select>

        <label className="label">Name / Company</label>
        <input
          className="input mb-3"
          style={{ fontSize: 16 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="label">Email</label>
        <input
          className="input mb-3"
          style={{ fontSize: 16 }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="label">Password</label>
        <input
          className="input mb-4"
          style={{ fontSize: 16 }}
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {err && <p className="mb-3 text-sm text-danger">{err}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={loading}>
          {loading ? "Creating…" : "Create my account"}
        </button>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already registered?{" "}
          <a className="font-medium text-accent hover:underline" href="/login">Log in</a>
        </p>
      </div>
    </AuthSplit>
  );
}
