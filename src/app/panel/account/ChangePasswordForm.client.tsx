"use client";

import { useState } from "react";
import { updatePassword } from "./actions";

export default function ChangePasswordForm() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (pw.length < 6) {
      setMsg({ type: "err", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    if (pw !== confirm) {
      setMsg({ type: "err", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    setSaving(true);
    const res = await updatePassword(pw);
    setSaving(false);
    if (res.error) {
      setMsg({ type: "err", text: res.error });
    } else {
      setMsg({ type: "ok", text: "Mot de passe mis à jour avec succès." });
      setPw("");
      setConfirm("");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Au moins 6 caractères"
          className="input w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input w-full"
        />
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
        disabled={saving || !pw || !confirm}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? "Mise à jour…" : "Modifier le mot de passe"}
      </button>
    </div>
  );
}
