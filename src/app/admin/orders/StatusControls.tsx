"use client";

import { useEffect, useState, useTransition } from "react";
import { changeStatus } from "./actions";
import { useT } from "@/i18n/I18nProvider";
import type { OrderStatusRow } from "@/lib/orderStatus";

export default function StatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const [statuses, setStatuses] = useState<OrderStatusRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/statuses", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setStatuses(data.statuses || []))
      .catch(() => {});
  }, []);

  const options = statuses.filter((s) => s.slug !== status);

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((s) => (
        <button
          key={s.slug}
          disabled={pending}
          onClick={() => start(() => changeStatus(orderId, s.slug))}
          className={`rounded-md border border-line px-2 py-1 text-xs font-medium hover:bg-hovered disabled:opacity-50 ${s.color}`}
          title={`${t("adm.orders.moveTo")} ${s.title}`}
        >
          → {s.title}
        </button>
      ))}
      {options.length === 0 && <span className="text-xs text-ink-muted">—</span>}
    </div>
  );
}
