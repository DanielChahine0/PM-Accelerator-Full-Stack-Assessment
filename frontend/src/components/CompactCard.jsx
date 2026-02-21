import { Clock } from "lucide-react";

const STATUS_DOT = {
  active: "#16a34a",
  stale: "#ca8a04",
  error: "#dc2626",
  disabled: "#94a3b8",
};

export default function CompactCard({
  children,
  label,
  value,
  status,
  updatedAt,
  loading = false,
  disabled = false,
  className = "",
  style = {},
  icon,
  onClick,
}) {
  if (loading) {
    return (
      <div className={`compact-card compact-card--loading ${className}`} style={style}>
        <div className="compact-card__skeleton-line" />
      </div>
    );
  }

  const dotColor = STATUS_DOT[status] || null;

  return (
    <div
      className={`compact-card ${disabled ? "compact-card--disabled" : ""} ${onClick ? "compact-card--clickable" : ""} ${className}`}
      style={style}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="compact-card__left">
        {dotColor && <span className="compact-card__dot" style={{ background: dotColor }} />}
        {icon && <span className="compact-card__icon">{icon}</span>}
        {label && <span className="compact-card__label">{label}</span>}
      </div>
      <div className="compact-card__right">
        {value && <span className="compact-card__value">{value}</span>}
        {updatedAt && (
          <span className="compact-card__updated">
            <Clock size={10} />
            {updatedAt}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
