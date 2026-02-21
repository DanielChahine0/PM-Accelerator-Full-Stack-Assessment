import React from 'react';
import './StandardCard.css';

function StatusDot({ status }) {
  return <span className={`std-status-dot std-dot-${status}`} title={status} />;
}

function StandardCard({ data, loading, empty, disabled }) {
  if (loading) {
    return (
      <div className="standard-card standard-card--loading">
        <div className="skeleton skeleton-std-title" />
        <div className="skeleton skeleton-std-temp" />
        <div className="skeleton skeleton-std-meta" />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="standard-card standard-card--empty">
        <span className="std-empty-msg">—</span>
      </div>
    );
  }

  const {
    location,
    temperature,
    condition,
    high,
    low,
    status = 'active',
    priority = 'medium',
    updatedAt,
  } = data || {};

  return (
    <article className={`standard-card${disabled ? ' standard-card--disabled' : ''}`}>
      <div className="std-header">
        <StatusDot status={status} />
        <span className="std-location">{location}</span>
        <span className={`std-priority std-priority-${priority}`}>{priority[0].toUpperCase()}</span>
      </div>

      <div className="std-temp-row">
        <span className="std-temp">{temperature}°</span>
        <span className="std-condition">{condition}</span>
      </div>

      <div className="std-range">
        <span className="std-range-item">H {high}°</span>
        <span className="std-range-sep">/</span>
        <span className="std-range-item">L {low}°</span>
      </div>

      {updatedAt && (
        <time className="std-updated" dateTime={updatedAt}>
          {new Date(updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </time>
      )}
    </article>
  );
}

export default StandardCard;
