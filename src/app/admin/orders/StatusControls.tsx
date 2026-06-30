"use client";

import { useTransition } from "react";
import { changeStatus } from "./actions";
import { STATUS_META, NEXT_STATUSES, type OrderStatus } from "@/lib/types";
import { useT } from "@/i18n/I18nProvider";

export default function StatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const options = NEXT_STATUSES[status] ?? [];

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((s) => (
        <button
          key={s}
          disabled={pending}
          onClick={() => start(() => changeStatus(orderId, s))}
          className={`rounded-md border border-line px-2 py-1 text-xs font-medium hover:bg-hovered disabled:opacity-50 ${STATUS_META[s].color}`}
          title={`${t("adm.orders.moveTo")} ${STATUS_META[s].label}`}
        >
          → {STATUS_META[s].label}
        </button>
      ))}
      {options.length === 0 && <span className="text-xs text-ink-muted">—</span>}
    </div>
  );
}
