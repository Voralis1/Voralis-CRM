export default function BarChart({
  data,
  color = "var(--accent)",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (!data.length) {
    return <div className="text-sm text-ink-muted">Aucune donnée.</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-44 gap-2">
      {data.map((d, i) => {
        const pct = Math.max(Math.round((d.value / max) * 100), d.value > 0 ? 6 : 2);
        return (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="font-mono text-xs font-semibold text-ink">{d.value}</div>
            <div className="flex w-full min-h-0 flex-1 items-end">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 70%, white))`,
                }}
                title={`${d.label} : ${d.value}`}
              />
            </div>
            <div className="truncate text-[11px] text-ink-muted">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
