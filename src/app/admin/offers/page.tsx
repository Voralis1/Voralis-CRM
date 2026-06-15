import { createClient } from "@/lib/supabase/server";
import { createOffer, toggleOffer } from "./actions";

export default async function OffersAdmin() {
  const supabase = createClient();
  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .order("country", { ascending: true });

  const rows = offers ?? [];

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">ID</th><th className="th">Nom</th><th className="th">Pays</th>
              <th className="th">Payout</th><th className="th">Modèle</th><th className="th">Statut</th><th className="th"></th>
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
                  <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="td">
                  <form action={toggleOffer.bind(null, o.id, o.status === "active" ? "paused" : "active")}>
                    <button className="text-xs text-brand-light hover:underline">
                      {o.status === "active" ? "Suspendre" : "Activer"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-brand-dark">Nouvelle offre</h2>
        <form action={createOffer} className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div><label className="label">ID</label><input className="input" name="id" placeholder="AO-LUMORA-001" required /></div>
          <div><label className="label">Nom</label><input className="input" name="name" required /></div>
          <div><label className="label">Produit</label><input className="input" name="product" /></div>
          <div><label className="label">Pays (ISO2)</label><input className="input" name="country" maxLength={2} placeholder="AO" required /></div>
          <div><label className="label">Payout</label><input className="input" name="payout" type="number" step="0.01" required /></div>
          <div><label className="label">Devise</label><input className="input" name="currency" defaultValue="USD" maxLength={3} /></div>
          <div>
            <label className="label">Modèle</label>
            <select className="input" name="payout_model" defaultValue="delivered">
              <option value="delivered">delivered</option>
              <option value="confirmed">confirmed</option>
            </select>
          </div>
          <div className="col-span-2 flex items-end lg:col-span-3">
            <button className="btn-primary">Créer l'offre</button>
          </div>
        </form>
      </section>
    </div>
  );
}
