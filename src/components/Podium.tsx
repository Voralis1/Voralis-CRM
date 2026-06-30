type PodiumItem = { name: string; count: number };

// Ordre d'affichage : 2e, 1er, 3e (le 1er au centre, plus haut)
const SLOTS = [
  { rank: 2, height: "h-16", color: "#94a3b8", ring: "ring-[#94a3b8]" },
  { rank: 1, height: "h-24", color: "#f59e0b", ring: "ring-[#f59e0b]" },
  { rank: 3, height: "h-12", color: "#b45309", ring: "ring-[#b45309]" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return (letters || "??").toUpperCase();
}

export default function Podium({ items }: { items: PodiumItem[] }) {
  if (!items.length) {
    return <div className="text-sm text-ink-muted">Aucun affiliate.</div>;
  }

  return (
    <div className="flex items-end justify-center gap-3 pt-2">
      {SLOTS.map((slot) => {
        const item = items[slot.rank - 1];
        if (!item) {
          return <div key={slot.rank} className="w-20" />;
        }
        return (
          <div key={slot.rank} className="flex w-20 flex-col items-center">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-offset-2 ring-offset-surface"
              style={{ background: slot.color, boxShadow: `0 0 0 0 ${slot.color}` }}
            >
              {initials(item.name)}
            </span>
            <div className="mt-1.5 w-full truncate text-center text-xs font-medium text-ink" title={item.name}>
              {item.name}
            </div>
            <div className="font-mono text-[11px] text-ink-muted">{item.count} leads</div>
            <div
              className={"mt-1.5 flex w-full items-start justify-center rounded-t-md " + slot.height}
              style={{ background: `linear-gradient(180deg, ${slot.color}33, ${slot.color}14)`, borderTop: `2px solid ${slot.color}` }}
            >
              <span className="mt-1 text-base font-bold" style={{ color: slot.color }}>
                {slot.rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
