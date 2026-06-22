import { createAdminClient } from "@/lib/supabase/admin";
import { toggleAffiliate, regenerateToken } from "./actions";
import TokenCell from "./TokenCell";

export default async function AffiliatesAdmin() {
  // Page protégée par le layout admin -> client admin (token lisible).
  // Un affilié (table `affiliate`) est rattaché à un réseau (`affiliate_network`)
  // qui porte le token / postback / statut.
  const db = createAdminClient();
  const { data: affiliates } = await db
    .from("affiliate")
    .select("id, name, affiliate_network(id, name, api_token, postback_url, status)")
    .order("name", { ascending: true });

  const rows = affiliates ?? [];

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">Affiliate network</th>
              <th className="th">Affiliate</th>
              <th className="th">Token API</th>
              <th className="th">Postback</th>
              <th className="th">Statut</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const net = (a as any).affiliate_network as {
                id: string; name: string; api_token: string; postback_url: string | null; status: string;
              } | null;
              return (
                <tr key={a.id}>
                  <td className="td font-medium">{net?.name ?? "—"}</td>
                  <td className="td">{a.name}</td>
                  <td className="td">{net ? <TokenCell token={net.api_token} /> : "—"}</td>
                  <td className="td">
                    {net?.postback_url
                      ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">configuré</span>
                      : <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">absent</span>}
                  </td>
                  <td className="td">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${net?.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                      {net?.status ?? "—"}
                    </span>
                  </td>
                  <td className="td">
                    {net && (
                      <div className="flex items-center gap-3">
                        <form action={toggleAffiliate.bind(null, net.id, net.status === "active" ? "paused" : "active")}>
                          <button className="text-xs text-brand-light hover:underline">
                            {net.status === "active" ? "Suspendre" : "Réactiver"}
                          </button>
                        </form>
                        <form action={regenerateToken.bind(null, net.id)}>
                          <button className="text-xs text-rose-600 hover:underline">Régénérer le token</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={6}>Aucun affilié.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
