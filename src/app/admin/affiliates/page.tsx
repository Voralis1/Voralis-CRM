import { createClient } from "@/lib/supabase/server";
import { toggleAffiliate } from "./actions";
import { setUserRole } from "../orders/actions";

export default async function AffiliatesAdmin() {
  const supabase = createClient();
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("id, name, email, postback_url, status, created_at")
    .order("created_at", { ascending: false });

  const rows = affiliates ?? [];

  async function promote(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const role = String(formData.get("role") || "agent") as "agent" | "admin" | "affiliate";
    await setUserRole(email, role);
  }

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">Affilié</th><th className="th">Email</th>
              <th className="th">Postback</th><th className="th">Statut</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="td font-medium">{a.name}</td>
                <td className="td text-sm text-slate-500">{a.email}</td>
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
            {rows.length === 0 && <tr><td className="td text-center text-slate-400" colSpan={5}>Aucun affilié.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h2 className="mb-1 text-base font-semibold text-brand-dark">Attribuer un rôle</h2>
        <p className="mb-4 text-sm text-slate-500">Promouvoir un compte existant en agent (centre d'appel) ou admin.</p>
        <form action={promote} className="flex flex-wrap items-end gap-3">
          <div className="grow"><label className="label">Email du compte</label><input className="input" name="email" type="email" required /></div>
          <div>
            <label className="label">Rôle</label>
            <select className="input w-40" name="role" defaultValue="agent">
              <option value="agent">agent</option>
              <option value="admin">admin</option>
              <option value="affiliate">affiliate</option>
            </select>
          </div>
          <button className="btn-primary">Appliquer</button>
        </form>
      </section>
    </div>
  );
}
