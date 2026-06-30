"use client";

import { useState } from "react";
import { updatePassword } from "./actions";
import { useT } from "@/i18n/I18nProvider";

export default function ChangePasswordForm() {
  const t = useT();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (pw.length < 6) {
      setMsg({ type: "err", text: t("aff.account.pwTooShort") });
      return;
    }
    if (pw !== confirm) {
      setMsg({ type: "err", text: t("aff.account.pwMismatch") });
      return;
    }
    setSaving(true);
    const res = await updatePassword(pw);
    setSaving(false);
    if (res.error) {
      setMsg({ type: "err", text: res.error });
    } else {
      setMsg({ type: "ok", text: t("aff.account.pwUpdated") });
      setPw("");
      setConfirm("");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">{t("aff.account.labelNewPw")}</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={t("aff.account.newPwPlaceholder")}
          className="input w-full"
        />
      </div>
      <div>
        <label className="label">{t("aff.account.labelConfirmPw")}</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input w-full"
        />
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
        disabled={saving || !pw || !confirm}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? t("aff.account.updating") : t("aff.account.updatePw")}
      </button>
    </div>
  );
}
