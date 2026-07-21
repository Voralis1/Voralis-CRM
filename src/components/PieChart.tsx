const PALETTE = [
  "#8b5cf6", // violet
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // orange
  "#06b6d4", // cyan
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
];
const OTHER_COLOR = "#94a3b8";

export interface PieChartDatum {
  label: string;
  value: number;
  // Sous-répartition (ex. titres précis d'un même slug), affichée en
  // retrait sous la ligne principale sans influencer le découpage du
  // camembert lui-même (toujours tracé au niveau `value`). `key` doit être
  // stable et unique par groupe : deux sous-lignes peuvent afficher le
  // même texte (ex. une commande orpheline sans titre précis retombe sur
  // le même libellé que le titre par défaut du slug) sans être le même
  // groupe, donc on ne peut pas utiliser le libellé comme clé React.
  sub?: { key: string; label: string; value: number }[];
}

export default function PieChart({
  data,
  maxSlices = 6,
}: {
  data: PieChartDatum[];
  maxSlices?: number;
}) {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return <div className="text-sm text-ink-muted">Aucune donnée.</div>;
  }

  // Regroupe le surplus dans « Autres »
  const head = sorted.slice(0, maxSlices);
  const tail = sorted.slice(maxSlices);
  const slices = [...head];
  if (tail.length) {
    slices.push({ label: "Autres", value: tail.reduce((a, d) => a + d.value, 0) });
  }

  const size = 160;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle cx={center} cy={center} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
          {slices.map((s, i) => {
            const frac = s.value / total;
            const seg = frac * c;
            const color = s.label === "Autres" ? OTHER_COLOR : PALETTE[i % PALETTE.length];
            const dashoffset = c - acc;
            acc += seg;
            return (
              <circle
                key={s.label}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${seg} ${c - seg}`}
                strokeDashoffset={dashoffset}
              />
            );
          })}
        </g>
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="fill-ink"
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          className="fill-ink-muted"
          style={{ fontSize: 10, letterSpacing: "0.08em" }}
        >
          LEADS
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((s, i) => {
          const pct = Math.round((s.value / total) * 1000) / 10;
          const color = s.label === "Autres" ? OTHER_COLOR : PALETTE[i % PALETTE.length];
          const subItems = "sub" in s ? s.sub : undefined;
          return (
            <li key={s.label}>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
                <span className="min-w-0 flex-1 truncate text-ink-muted">{s.label}</span>
                <span className="font-mono font-semibold text-ink">{s.value}</span>
                <span className="w-12 text-right font-mono text-xs text-ink-faint">{pct}%</span>
              </div>
              {subItems && subItems.length > 1 && (
                <ul className="ml-[18px] mt-1 space-y-1 border-l border-line pl-3">
                  {[...subItems].sort((a, b) => b.value - a.value).map((sub) => {
                    const subPct = Math.round((sub.value / total) * 1000) / 10;
                    return (
                      <li key={sub.key} className="flex items-center gap-2 text-xs text-ink-faint">
                        <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                        <span className="font-mono">{sub.value}</span>
                        <span className="w-12 text-right font-mono">{subPct}%</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
