import { Icon, type IconName } from "@/components/icons";

export type KpiColor = "green" | "red" | "violet" | "orange" | "blue" | "cyan";

const COLOR_VAR: Record<KpiColor, string> = {
  green: "var(--status-success)",
  red: "var(--status-danger)",
  violet: "var(--status-violet)",
  orange: "var(--status-warning)",
  blue: "var(--status-info)",
  cyan: "var(--status-cyan)",
};

export default function KpiCard({
  label,
  value,
  icon,
  color = "violet",
  delta,
  deltaPositive,
  description,
}: {
  label: string;
  value: React.ReactNode;
  icon?: IconName;
  color?: KpiColor;
  delta?: string;
  deltaPositive?: boolean;
  description?: string;
}) {
  return (
    <div className="kpi-card" style={{ ["--kpi-color" as string]: COLOR_VAR[color] }}>
      <div className="flex items-start justify-between gap-2">
        <div className="kpi-label">{label}</div>
        {icon && (
          <span className="kpi-icon">
            <Icon name={icon} size={18} />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="kpi-value">{value}</div>
        {delta != null && (
          <span className={"mb-1 kpi-delta " + (deltaPositive ? "kpi-delta-up" : "kpi-delta-down")}>
            <Icon name={deltaPositive ? "trending-up" : "trending-down"} size={12} />
            {delta}
          </span>
        )}
      </div>

      {description && <div className="kpi-desc mt-1.5">{description}</div>}
    </div>
  );
}
