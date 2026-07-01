import { createClient } from "@/lib/supabase/server";
import { createOffer, toggleOffer } from "./actions";
import { getServerT } from "@/i18n/server";

export default async function OffersAdmin() {
  const t = getServerT();
  const supabase = createClient();
  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .order("country", { ascending: true });
  const { data: products } = await supabase
    .from("project_products")
    .select("id, name, projects(name)")
    .order("name", { ascending: true });

  const rows = offers ?? [];
  const productRows = products ?? [];

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.offers.colId")}</th><th className="th">{t("adm.offers.colName")}</th><th className="th">{t("adm.offers.colCountry")}</th>
              <th className="th">{t("adm.offers.colPayout")}</th><th className="th">{t("adm.offers.colModel")}</th><th className="th">{t("adm.offers.colStatus")}</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="td font-mono text-xs">{o.id}</td>
                <td className="td">{o.name}</td>
                <td className="td">{o.country}</td>
                <td className="td">{o.payout} {o.currency}</td>
                <td className="td text-xs">{o.payout_model}</td>
                <td className="td">
                  <span className={`badge ${o.status === "active" ? "badge-success" : "badge-neutral"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="td">
                  <form action={toggleOffer.bind(null, o.id, o.status === "active" ? "paused" : "active")}>
                    <button className="text-xs text-accent hover:underline">
                      {o.status === "active" ? t("adm.offers.suspend") : t("adm.offers.activate")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">{t("adm.offers.newOffer")}</h2>
        <form action={createOffer} className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div>
            <label className="label">{t("adm.offers.labelProduct")}</label>
            <select className="input" name="productId" required defaultValue="">
              <option value="" disabled>{t("adm.offers.selectProduct")}</option>
              {productRows.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.projects?.name ?? p.id}
                </option>
              ))}
            </select>
          </div>
          <div><label className="label">{t("adm.offers.labelName")}</label><input className="input" name="name" required /></div>
          <div><label className="label">{t("adm.offers.labelCountry")}</label><input className="input" name="country" maxLength={2} placeholder={t("adm.offers.phCountry")} required /></div>
          <div><label className="label">{t("adm.offers.labelPayout")}</label><input className="input" name="payout" type="number" step="0.01" required /></div>
          <div><label className="label">{t("adm.offers.labelCurrency")}</label><input className="input" name="currency" defaultValue="USD" maxLength={3} /></div>
          <div>
            <label className="label">{t("adm.offers.labelModel")}</label>
            <select className="input" name="payout_model" defaultValue="delivered">
              <option value="delivered">delivered</option>
              <option value="confirmed">confirmed</option>
            </select>
          </div>
          <div className="col-span-2 flex items-end lg:col-span-3">
            <button className="btn-primary">{t("adm.offers.createOffer")}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
