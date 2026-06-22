import { createAdminClient } from "@/lib/supabase/admin";
import { toggleAffiliate, regenerateToken } from "./actions";
import TokenCell from "./TokenCell";

export default async function AffiliatesAdmin() {
  // Page protégée par le layout admin -> on lit via le client admin pour avoir
  // accès au token API (non lisible via le client de session à cause des RLS).
  const db = createAdminClient();
  const { data: affiliates } = await db
    .from("affiliates")
    .select("id, name, email, api_token, postback_url, status, created_at")
    .order("created_at", { ascending: false });

  const rows = affiliates ?? [];

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">Affilié</th><th className="th">Email</th>
              <th className="th">Token API</th>
              <th className="th">Postback</th><th className="th">Statut</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="td font-medium">{a.name}</td>
                <td className="td text-sm text-slate-500">{a.email}</td>
                <td className="td">
                  <div className="flex items-center gap-3">
                    <TokenCell token={a.api_token} />
                    <form action={regenerateToken.bind(null, a.id)}>
                      <button className="text-xs text-rose-600 hover:underline">Régénérer</button>
                    </form>
                  </div>
                </td>
                <td className="td">
                  {a.postback_url
                    ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">configuré</span>
                    : <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">absent</span>}
                </td>
                <td className="td">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${a.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                    {a.status}
                  </span>
                </td>
                <td className="td">
                  <form action={toggleAffiliate.bind(null, a.id, a.status === "active" ? "paused" : "active")}>
                    <button className="text-xs text-brand-light hover:underline">
                      {a.status === "active" ? "Suspendre" : "Réactiver"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={6}>Aucun affilié.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
