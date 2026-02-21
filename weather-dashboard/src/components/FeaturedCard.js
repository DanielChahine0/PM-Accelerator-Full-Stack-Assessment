import React from 'react';
import './FeaturedCard.css';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function PriorityTag({ priority }) {
  return <span className={`priority-tag priority-${priority}`}>{priority}</span>;
}

function FeaturedCard({ data, loading, empty, disabled }) {
  if (loading) {
    return (
      <div className="featured-card featured-card--loading">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
        <div className="skeleton skeleton-body" />
        <div className="skeleton skeleton-meta" />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="featured-card featured-card--empty">
        <p className="empty-message">No featured data available.</p>
      </div>
    );
  }

  const {
    location,
    temperature,
    condition,
    humidity,
    windSpeed,
    status = 'active',
    priority = 'high',
    updatedAt,
    description,
  } = data || {};

  return (
    <article className={`featured-card${disabled ? ' featured-card--disabled' : ''}`}>
      <header className="featured-card__header">
        <div className="featured-card__location-row">
          <h2 className="featured-card__location">{location}</h2>
          <PriorityTag priority={priority} />
        </div>
        <div className="featured-card__status-row">
          <StatusBadge status={status} />
          {updatedAt && (
            <time className="featured-card__updated" dateTime={updatedAt}>
              Updated {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          )}
        </div>
      </header>

      <div className="featured-card__body">
        <div className="featured-card__temp-block">
          <span className="featured-card__temp">{temperature}°</span>
          <span className="featured-card__condition">{condition}</span>
        </div>
        {description && <p className="featured-card__description">{description}</p>}
      </div>

      <footer className="featured-card__footer">
        <div className="featured-card__stat">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{humidity}%</span>
        </div>
        <div className="featured-card__stat">
          <span className="stat-label">Wind</span>
          <span className="stat-value">{windSpeed} km/h</span>
        </div>
      </footer>
    </article>
  );
}

export default FeaturedCard;
