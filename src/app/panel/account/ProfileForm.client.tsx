"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import { useT } from "@/i18n/I18nProvider";

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
}

export default function ProfileForm({ initialName, initialEmail }: ProfileFormProps) {
  const t = useT();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dirty = name !== initialName || email !== initialEmail;

  const submit = async () => {
    setMsg(null);
    if (!name.trim()) {
      setMsg({ type: "err", text: t("aff.account.nameRequired") });
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
          ? t("aff.account.profileUpdatedPending")
          : t("aff.account.profileUpdated"),
      });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">{t("aff.account.labelName")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />
      </div>
      <div>
        <label className="label">{t("aff.account.labelEmail")}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
        />
        <p className="mt-1 text-xs text-ink-muted">
          {t("aff.account.emailHelp")}
        </p>
      </div>

      {msg && (
        <div
          className={`alert ${
            msg.type === "ok" ? "alert-success" : "alert-danger"
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
        {saving ? t("aff.account.saving") : t("aff.account.saveChanges")}
      </button>
    </div>
  );
}
