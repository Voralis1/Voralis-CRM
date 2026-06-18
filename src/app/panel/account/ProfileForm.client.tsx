"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
}

export default function ProfileForm({ initialName, initialEmail }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dirty = name !== initialName || email !== initialEmail;

  const submit = async () => {
    setMsg(null);
    if (!name.trim()) {
      setMsg({ type: "err", text: "Le nom est obligatoire." });
      return;
    }
    setSaving(true);
    const res = await updateProfile(name, email);
    setSaving(false);
    if (res.error) {
      setMsg({ type: "err", text: res.error });
    } else {
      setMsg({
        type: "ok",
        text: res.emailPending
          ? "Profil mis à jour. Un email de confirmation a été envoyé à la nouvelle adresse pour valider le changement."
          : "Profil mis à jour avec succès.",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Nom (Affiliate network)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Adresse email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
        />
        <p className="mt-1 text-xs text-slate-400">
          Modifier l'email peut nécessiter une confirmation envoyée à la nouvelle adresse.
        </p>
      </div>

      {msg && (
        <div
          className={`rounded-md p-3 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={saving || !dirty}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </div>
  );
}
