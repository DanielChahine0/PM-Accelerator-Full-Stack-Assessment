import { Clock } from "lucide-react";

const STATUS_MAP = {
  active: { label: "Live", color: "#166534", bg: "#dcfce7" },
  stale: { label: "Stale", color: "#854d0e", bg: "#fef9c3" },
  error: { label: "Error", color: "#991b1b", bg: "#fee2e2" },
  disabled: { label: "Disabled", color: "#64748b", bg: "#f1f5f9" },
};

export default function StandardCard({
  children,
  title,
  status,
  updatedAt,
  loading = false,
  disabled = false,
  empty = false,
  emptyText = "—",
  className = "",
  style = {},
  headerRight,
  onClick,
}) {
  if (loading) {
    return (
      <div className={`std-card std-card--loading ${className}`} style={style}>
        <div className="std-card__skeleton-title" />
        <div className="std-card__skeleton-line" />
        <div className="std-card__skeleton-line short" />
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`std-card std-card--empty ${className}`} style={style}>
        <p className="std-card__empty-text">{emptyText}</p>
      </div>
    );
  }

  const st = STATUS_MAP[status] || null;

  return (
    <div
      className={`std-card ${disabled ? "std-card--disabled" : ""} ${onClick ? "std-card--clickable" : ""} ${className}`}
      style={style}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || st || updatedAt || headerRight) && (
        <div className="std-card__header">
          {title && <h3 className="std-card__title">{title}</h3>}
          <div className="std-card__header-meta">
            {st && (
              <span className="std-card__status" style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
            )}
            {updatedAt && (
              <span className="std-card__updated">
                <Clock size={10} />
                {updatedAt}
              </span>
            )}
            {headerRight}
          </div>
        </div>
      )}
      <div className="std-card__body">{children}</div>
    </div>
  );
}
