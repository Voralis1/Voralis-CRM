import { createAdminClient } from "@/lib/supabase/admin";
import { toggleAffiliate, regenerateToken } from "./actions";
import { getServerT } from "@/i18n/server";
import TokenCell from "./TokenCell";

export default async function AffiliatesAdmin() {
  const t = getServerT();
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
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.affiliates.colNetwork")}</th>
              <th className="th">{t("adm.affiliates.colAffiliate")}</th>
              <th className="th">{t("adm.affiliates.colApiToken")}</th>
              <th className="th">{t("adm.affiliates.colPostback")}</th>
              <th className="th">{t("adm.affiliates.colStatus")}</th>
              <th className="th">{t("adm.affiliates.colAction")}</th>
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
                      ? <span className="badge badge-success">{t("adm.affiliates.configured")}</span>
                      : <span className="badge badge-warning">{t("adm.affiliates.absent")}</span>}
                  </td>
                  <td className="td">
                    <span className={`badge ${net?.status === "active" ? "badge-success" : "badge-danger"}`}>
                      {net?.status ?? "—"}
                    </span>
                  </td>
                  <td className="td">
                    {net && (
                      <div className="flex items-center gap-3">
                        <form action={toggleAffiliate.bind(null, net.id, net.status === "active" ? "paused" : "active")}>
                          <button className="text-xs text-accent hover:underline">
                            {net.status === "active" ? t("adm.affiliates.suspend") : t("adm.affiliates.reactivate")}
                          </button>
                        </form>
                        <form action={regenerateToken.bind(null, net.id)}>
                          <button className="text-xs text-danger hover:underline">{t("adm.affiliates.regenerateToken")}</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td className="td text-center text-ink-muted" colSpan={6}>{t("adm.affiliates.empty")}</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
