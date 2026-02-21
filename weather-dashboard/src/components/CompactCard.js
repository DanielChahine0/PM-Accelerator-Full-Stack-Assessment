import React from 'react';
import './CompactCard.css';

function CompactCard({ data, loading, empty, disabled }) {
  if (loading) {
    return (
      <div className="compact-card compact-card--loading">
        <div className="skeleton skeleton-cmp-loc" />
        <div className="skeleton skeleton-cmp-temp" />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="compact-card compact-card--empty">
        <span className="cmp-empty">No data</span>
      </div>
    );
  }

  const {
    location,
    temperature,
    condition,
    status = 'active',
    priority = 'low',
    updatedAt,
  } = data || {};

  return (
    <article className={`compact-card${disabled ? ' compact-card--disabled' : ''}`}>
      <div className="cmp-left">
        <span className={`cmp-dot cmp-dot-${status}`} />
        <div className="cmp-info">
          <span className="cmp-location">{location}</span>
          <span className="cmp-condition">{condition}</span>
        </div>
      </div>

      <div className="cmp-right">
        <span className="cmp-temp">{temperature}°</span>
        <div className="cmp-meta">
          <span className={`cmp-priority cmp-priority-${priority}`}>{priority[0].toUpperCase()}</span>
          {updatedAt && (
            <time className="cmp-time" dateTime={updatedAt}>
              {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          )}
        </div>
      </div>
    </article>
  );
}

export default CompactCard;
