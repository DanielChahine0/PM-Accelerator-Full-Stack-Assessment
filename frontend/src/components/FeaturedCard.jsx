import { Clock } from "lucide-react";

const STATUS_MAP = {
  active: { label: "Live", color: "#166534", bg: "#dcfce7" },
  stale: { label: "Stale", color: "#854d0e", bg: "#fef9c3" },
  error: { label: "Error", color: "#991b1b", bg: "#fee2e2" },
  disabled: { label: "Disabled", color: "#64748b", bg: "#f1f5f9" },
};

const PRIORITY_BAR = {
  high: "#d93025",
  medium: "#f9ab00",
  low: "#94a3b8",
};

export default function FeaturedCard({
  children,
  title,
  subtitle,
  status,
  updatedAt,
  priority,
  loading = false,
  disabled = false,
  empty = false,
  emptyText = "No data available",
  className = "",
  style = {},
  headerRight,
}) {
  const st = STATUS_MAP[status] || null;
  const barColor = PRIORITY_BAR[priority] || null;

  if (loading) {
    return (
      <div className={`featured-card featured-card--loading ${className}`} style={style}>
        <div className="featured-card__skeleton-title" />
        <div className="featured-card__skeleton-block" />
        <div className="featured-card__skeleton-row">
          <div className="featured-card__skeleton-chip" />
          <div className="featured-card__skeleton-chip" />
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`featured-card featured-card--empty ${className}`} style={style}>
        <p className="featured-card__empty-text">{emptyText}</p>
      </div>
    );
  }

  return (
    <div
      className={`featured-card ${disabled ? "featured-card--disabled" : ""} ${className}`}
      style={style}
    >
      {barColor && <div className="featured-card__priority-bar" style={{ background: barColor }} />}

      {(title || st || updatedAt || headerRight) && (
        <div className="featured-card__header">
          <div className="featured-card__header-left">
            {title && <h2 className="featured-card__title">{title}</h2>}
            {subtitle && <p className="featured-card__subtitle">{subtitle}</p>}
          </div>
          <div className="featured-card__header-meta">
            {st && (
              <span
                className="featured-card__status"
                style={{ background: st.bg, color: st.color }}
              >
                {st.label}
              </span>
            )}
            {updatedAt && (
              <span className="featured-card__updated">
                <Clock size={11} />
                {updatedAt}
              </span>
            )}
            {headerRight}
          </div>
        </div>
      )}

      <div className="featured-card__body">{children}</div>
    </div>
  );
}
