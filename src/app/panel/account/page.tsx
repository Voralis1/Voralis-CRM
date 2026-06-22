import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "./ChangePasswordForm.client";
import ProfileForm from "./ProfileForm.client";

export const dynamic = "force-dynamic";

export default async function PanelAccount() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: aff } = await supabase
    .from("affiliate_network")
    .select("name, email, status, created_at")
    .eq("auth_user_id", auth.user!.id)
    .maybeSingle();

  const readOnly: { label: string; value: string }[] = [
    { label: "Statut du compte", value: aff?.status ?? "—" },
    {
      label: "Membre depuis",
      value: aff?.created_at
        ? new Date(aff.created_at).toLocaleDateString("fr-FR")
        : "—",
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon compte</h1>
        <p className="text-sm text-slate-500">Informations de ton compte et sécurité.</p>
      </div>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-brand-dark">Informations du compte</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">Modifie ton nom et ton adresse email.</p>
        <ProfileForm
          initialName={aff?.name ?? ""}
          initialEmail={aff?.email ?? auth.user?.email ?? ""}
        />
        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          {readOnly.map((i) => (
            <div key={i.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {i.label}
              </dt>
              <dd className="mt-1 font-medium text-brand-dark">{i.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-brand-dark">Modifier le mot de passe</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Choisis un nouveau mot de passe pour sécuriser ton compte.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
