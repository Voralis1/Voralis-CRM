"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function DateRangeCalendar({
  onChange,
}: {
  onChange?: (range: { start: Date | null; end: Date | null }) => void;
}) {
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [start, setStart] = useState<Date | null>(today);
  const [end, setEnd] = useState<Date | null>(today);

  const emit = (s: Date | null, e: Date | null) => {
    setStart(s);
    setEnd(e);
    onChange?.({ start: s, end: e });
  };

  const pick = (day: Date) => {
    if (!start || (start && end)) {
      emit(day, null);
    } else if (day < start) {
      emit(day, start);
    } else {
      emit(start, day);
    }
  };

  const inRange = (day: Date) => {
    if (!start) return false;
    const e = end ?? start;
    const lo = start < e ? start : e;
    const hi = start < e ? e : start;
    return day >= lo && day <= hi;
  };

  // Construction de la grille (lundi en premier)
  const firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - offset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const shiftMonth = (delta: number) =>
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));

  const label =
    start && end && !sameDay(start, end)
      ? `${fmt(start)} → ${fmt(end)}`
      : start
      ? fmt(start)
      : "Filtrer par date";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Filtrer par date"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-ink-muted transition hover:border-line-strong hover:text-ink"
      >
        <Icon name="calendar" size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-40 w-[300px] rounded-lg border border-line bg-surface p-4 shadow-modal">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Mois précédent"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition hover:bg-hovered hover:text-ink"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <div className="text-sm font-semibold text-ink">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Mois suivant"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition hover:bg-hovered hover:text-ink"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-[11px] font-semibold uppercase text-ink-faint">
                  {w}
                </div>
              ))}
              {days.map((d, i) => {
                const muted = d.getMonth() !== view.getMonth();
                const selected = inRange(d);
                const isEdge = (start && sameDay(d, start)) || (end && sameDay(d, end));
                const isToday = sameDay(d, today);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(d)}
                    className={
                      "flex h-9 items-center justify-center rounded-md text-sm transition " +
                      (isEdge
                        ? "bg-accent font-semibold text-white"
                        : selected
                        ? "bg-accent-dim text-accent"
                        : "hover:bg-hovered " + (muted ? "text-ink-faint" : "text-ink")) +
                      (isToday && !isEdge ? " ring-1 ring-accent-border" : "")
                    }
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-line pt-3 text-xs">
              <span className="text-ink-muted">Période : </span>
              <span className="font-mono text-ink">{label}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
