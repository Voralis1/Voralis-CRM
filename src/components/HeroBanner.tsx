import { Icon } from "@/components/icons";

export default function HeroBanner({
  label,
  title,
  children,
}: {
  label?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hero-banner">
      {label && (
        <div className="hero-badge">
          <Icon name="sparkle" size={14} />
          {label}
        </div>
      )}
      <h2 className="hero-title">{title}</h2>
      {children && <div className="hero-sub mt-2">{children}</div>}
    </div>
  );
}
