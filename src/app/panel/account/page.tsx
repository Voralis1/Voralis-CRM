import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "./ChangePasswordForm.client";
import ProfileForm from "./ProfileForm.client";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

function initials(value?: string | null) {
  if (!value) return "??";
  const base = value.includes("@") ? value.split("@")[0] : value;
  const parts = base.split(/[\s.\-_]/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return letters.toUpperCase();
}

export default async function PanelAccount() {
  const t = getServerT();
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: aff } = await supabase
    .from("affiliate_network")
    .select("name, email, status, created_at")
    .eq("auth_user_id", auth.user!.id)
    .maybeSingle();

  const name = aff?.name ?? "";
  const email = aff?.email ?? auth.user?.email ?? "";
  const status = aff?.status ?? "—";
  const memberSince = aff?.created_at ? new Date(aff.created_at).toLocaleDateString("fr-FR") : "—";
  const statusClass =
    status === "active" ? "badge-success" : status === "paused" ? "badge-warning" : "badge-neutral";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* En-tête de profil centré */}
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-dim text-2xl font-bold text-accent">
          {initials(name || email)}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">{name || t("aff.account.defaultName")}</h1>
        <p className="text-sm text-ink-muted">{email}</p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={`badge ${statusClass}`}>{status}</span>
          <span className="text-ink-muted">{t("aff.account.memberSince")} {memberSince}</span>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink">{t("aff.account.infoTitle")}</h2>
        <p className="mb-4 mt-1 text-sm text-ink-muted">{t("aff.account.infoSubtitle")}</p>
        <ProfileForm initialName={name} initialEmail={email} />
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink">{t("aff.account.changePwTitle")}</h2>
        <p className="mb-4 mt-1 text-sm text-ink-muted">
          {t("aff.account.changePwSubtitle")}
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
