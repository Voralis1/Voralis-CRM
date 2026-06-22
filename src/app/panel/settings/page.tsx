import { createClient } from "@/lib/supabase/server";
import { CopyField } from "@/components/CopyField";
import { savePostback, regenerateToken } from "./actions";

export default async function PanelSettings() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: aff } = await supabase
    .from("affiliate_network")
    .select("api_token, postback_url, postback_method, signature_secret")
    .eq("auth_user_id", auth.user!.id)
    .single();

  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="max-w-3xl space-y-6">
      <section className="card p-6">
        <h2 className="text-base font-semibold text-brand-dark">Token API</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Utilise ce token dans l'en-tête <code className="font-mono">Authorization: Bearer ...</code> pour toutes les requêtes vers l'API de lead.
        </p>
        <CopyField value={aff?.api_token ?? ""} />
        <form action={regenerateToken} className="mt-3">
          <button className="btn-ghost text-rose-600">Régénérer le token</button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-brand-dark">Utilisation de l'API Leads</h2>
        <p className="mb-3 text-sm text-slate-500">
          Envoie un lead via l'endpoint <strong>POST /api/v1/leads</strong>. Le corps doit être du JSON valide.
        </p>

        <div className="grid gap-3">
          <div>
            <div className="text-sm font-medium text-slate-700">Requête</div>
            <div className="mt-2 rounded bg-slate-950 p-3 text-[11px] text-slate-100 font-mono overflow-x-auto">
              POST {base || "https://example.com"}/api/v1/leads
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Headers</div>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div><code className="font-mono">Authorization: Bearer &lt;API_TOKEN&gt;</code></div>
              <div><code className="font-mono">Content-Type: application/json</code></div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Payload minimal</div>
            <div className="mt-2 rounded bg-slate-950 p-3 text-[11px] text-slate-100 font-mono overflow-x-auto">
              {`{
  "offer_id": "offer_123",
  "first_name": "Jean",
  "phone": "+221770000000",
  "country": "SN"
}`}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Champs optionnels</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              <li><code>last_name</code></li>
              <li><code>address</code></li>
              <li><code>city</code></li>
              <li><code>quantity</code></li>
              <li><code>ip</code></li>
              <li><code>user_agent</code></li>
              <li><code>sub3</code> ... <code>sub5</code></li>
              <li><code>comment</code></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Pays supportés</div>
            <div className="mt-2 rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 font-mono">AO, ML, SN, CI, GN, GA, CG, MA</div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Codes de réponse</div>
            <div className="mt-2 grid gap-2 text-sm text-slate-600">
              <div><strong>201</strong> — Lead créé avec succès.</div>
              <div><strong>400</strong> — JSON invalide ou données non conformes.</div>
              <div><strong>401</strong> — Token manquant ou invalide.</div>
              <div><strong>403</strong> — Offre inconnue/inactive ou affilié suspendu.</div>
              <div><strong>409</strong> — Lead en doublon sur le même téléphone.</div>
              <div><strong>422</strong> — Pays non couvert par l'offre.</div>
              <div><strong>500</strong> — Erreur serveur.</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Exemple curl</div>
            <div className="mt-2 rounded bg-slate-950 p-3 text-[11px] text-slate-100 font-mono overflow-x-auto">
              {`curl -X POST ${base || "https://example.com"}/api/v1/leads \
  -H "Authorization: Bearer ${aff?.api_token ?? "<API_TOKEN>"}" \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id":"offer_123",
    "first_name":"Jean",
    "last_name":"Dupont",
    "phone":"+221770000000",
    "country":"SN",
    "address":"1 rue Exemple",
    "city":"Dakar",
    "quantity":1,
    "ip":"1.2.3.4",
    "user_agent":"MyAgent/1.0",
    "affiliate":"3379",
    "comment":"Test"
  }'`}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-brand-dark">URL de postback</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Macros disponibles : <code className="font-mono text-xs">
          {"{lead_id} {status} {payout} {currency} {offer_id} {country} {affiliate} {sub3}…{sub5} {timestamp}"}</code>
        </p>
        <form action={savePostback} className="space-y-3">
          <input
            className="input font-mono text-xs"
            name="postback_url"
            defaultValue={aff?.postback_url ?? ""}
            placeholder="https://votre-tracker.com/postback?affiliate={affiliate}&status={status}&payout={payout}"
          />
          <div className="flex items-center gap-3">
            <select className="input w-32" name="postback_method" defaultValue={aff?.postback_method ?? "GET"}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
            <button className="btn-primary">Enregistrer</button>
          </div>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          En POST, le corps JSON est signé (HMAC-SHA256) dans l'en-tête <code>X-Voralis-Signature</code>.
          Secret de signature : <code className="font-mono">{aff?.signature_secret}</code>
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-brand-dark">Endpoints</h2>
        <div className="mt-3 space-y-2 font-mono text-xs">
          <div className="rounded bg-brand-deep px-3 py-2 text-slate-100">POST&nbsp;&nbsp;{base || "https://example.com"}/api/v1/leads</div>
          <div className="rounded bg-brand-deep px-3 py-2 text-slate-100">GET&nbsp;&nbsp;&nbsp;{base || "https://example.com"}/api/v1/offers</div>
        </div>
      </section>
    </div>
  );
}
