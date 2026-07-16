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

export default async function MediaBuyingAccount() {
  const t = getServerT();
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", auth.user!.id)
    .maybeSingle();

  const name = profile?.full_name ?? "";
  const email = auth.user?.email ?? "";
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("fr-FR") : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* En-tête de profil centré */}
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-dim text-2xl font-bold text-accent">
          {initials(name || email)}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">{name || t("mb.account.defaultName")}</h1>
        <p className="text-sm text-ink-muted">{email}</p>
        <div className="mt-3 text-xs text-ink-muted">
          {t("mb.account.memberSince")} {memberSince}
        </div>
      </div>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink">{t("mb.account.infoTitle")}</h2>
        <p className="mb-4 mt-1 text-sm text-ink-muted">{t("mb.account.infoSubtitle")}</p>
        <ProfileForm initialName={name} initialEmail={email} />
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink">{t("mb.account.changePwTitle")}</h2>
        <p className="mb-4 mt-1 text-sm text-ink-muted">
          {t("mb.account.changePwSubtitle")}
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
