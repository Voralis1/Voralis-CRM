import { createClient } from "@/lib/supabase/server";
import { CopyField } from "@/components/CopyField";
import { Icon } from "@/components/icons";
import { savePostback, regenerateToken } from "./actions";
import { getServerT } from "@/i18n/server";

export default async function PanelSettings() {
  const t = getServerT();
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: aff } = await supabase
    .from("affiliate_network")
    .select("api_token, postback_url, postback_method, signature_secret")
    .eq("auth_user_id", auth.user!.id)
    .single();

  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* En-tête centré */}
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-accent">
          <Icon name="key" size={26} />
        </span>
        <h1 className="mt-3 text-2xl font-bold text-ink">{t("aff.settings.headerTitle")}</h1>
        <p className="mt-1 max-w-md text-sm text-ink-muted">
          {t("aff.settings.headerSubtitle")}
        </p>
      </div>

      {/* Token mis en avant, centré */}
      <section className="card p-6 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("aff.settings.tokenTitle")}</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-ink-muted">
          {t("aff.settings.tokenLeadPre")} <code className="font-mono">Authorization: Bearer …</code> {t("aff.settings.tokenLeadPost")}
        </p>
        <div className="mx-auto mt-4 max-w-lg">
          <CopyField value={aff?.api_token ?? ""} />
        </div>
        <form action={regenerateToken} className="mt-4 flex justify-center">
          <button className="btn btn-secondary text-danger">
            <Icon name="refresh" size={15} />
            {t("aff.settings.regenerateToken")}
          </button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink">{t("aff.settings.apiUsageTitle")}</h2>
        <p className="mb-3 text-sm text-ink-muted">
          {t("aff.settings.apiUsageLeadPre")} <strong>POST /api/v1/leads</strong>{t("aff.settings.apiUsageLeadPost")}
        </p>

        <div className="grid gap-3">
          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.request")}</div>
            <div className="mt-2 rounded bg-base p-3 text-[11px] text-ink font-mono overflow-x-auto border border-line">
              POST {base || "https://example.com"}/api/v1/leads
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.headers")}</div>
            <div className="mt-2 space-y-1 text-sm text-ink-muted">
              <div><code className="font-mono">Authorization: Bearer &lt;API_TOKEN&gt;</code></div>
              <div><code className="font-mono">Content-Type: application/json</code></div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.minPayload")}</div>
            <div className="mt-2 rounded bg-base p-3 text-[11px] text-ink font-mono overflow-x-auto border border-line">
              {`{
  "product_id": "218022",
  "first_name": "Jean",
  "phone": "+221770000000",
  "country": "SN",
  "quantity": 1,
  "affiliate": "3379"
}`}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.optionalFields")}</div>
            <p className="mt-1 text-xs text-ink-muted">
              <code>product_id</code> ou <code>product_name</code> — un des deux est <strong>obligatoire</strong> (product_id prioritaire si les deux sont envoyés).
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink-muted">
              <li><code>last_name</code></li>
              <li><code>address</code></li>
              <li><code>city</code></li>
              <li><code>ip</code></li>
              <li><code>user_agent</code></li>
              <li><code>sub3</code> ... <code>sub5</code></li>
              <li><code>comment</code></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.supportedCountries")}</div>
            <div className="mt-2 rounded bg-elevated px-3 py-2 text-sm text-ink font-mono">AO, ML, SN, CI, GN, GA, CG, MA</div>
          </div>

          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.responseCodes")}</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-muted">
              <div><strong>201</strong> — {t("aff.settings.code201")}</div>
              <div><strong>400</strong> — {t("aff.settings.code400")}</div>
              <div><strong>401</strong> — {t("aff.settings.code401")}</div>
              <div><strong>403</strong> — {t("aff.settings.code403")}</div>
              <div><strong>409</strong> — {t("aff.settings.code409")}</div>
              <div><strong>422</strong> — {t("aff.settings.code422")}</div>
              <div><strong>500</strong> — {t("aff.settings.code500")}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-ink">{t("aff.settings.curlExample")}</div>
            <div className="mt-2 rounded bg-base p-3 text-[11px] text-ink font-mono overflow-x-auto border border-line">
              {`curl -X POST ${base || "https://example.com"}/api/v1/leads \
  -H "Authorization: Bearer ${aff?.api_token ?? "<API_TOKEN>"}" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id":"218022",
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
        <h2 className="text-base font-semibold text-ink">{t("aff.settings.postbackTitle")}</h2>
        <p className="mb-3 mt-1 text-sm text-ink-muted">
          {t("aff.settings.macrosLabel")} <code className="font-mono text-xs">
          {"{lead_id} {status} {payout} {currency} {product_id} {country} {affiliate} {sub3}…{sub5} {timestamp}"}</code>
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
            <button className="btn-primary">{t("aff.settings.save")}</button>
          </div>
        </form>
        <p className="mt-3 text-xs text-ink-muted">
          {t("aff.settings.postbackSignedPre")} <code>X-Voralis-Signature</code>{t("aff.settings.postbackSignedPost")} <code className="font-mono">{aff?.signature_secret}</code>
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink">{t("aff.settings.endpointsTitle")}</h2>
        <div className="mt-3 space-y-2 font-mono text-xs">
          <div className="rounded bg-elevated px-3 py-2 text-ink">POST&nbsp;&nbsp;{base || "https://example.com"}/api/v1/leads</div>
          <div className="rounded bg-elevated px-3 py-2 text-ink">GET&nbsp;&nbsp;&nbsp;{base || "https://example.com"}/api/v1/leads/{"{lead_id}"}</div>
        </div>
      </section>
    </div>
  );
}
