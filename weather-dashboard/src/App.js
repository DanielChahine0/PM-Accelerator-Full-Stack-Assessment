import React, { useState, useEffect } from 'react';
import FeaturedCard from './components/FeaturedCard';
import StandardCard from './components/StandardCard';
import CompactCard from './components/CompactCard';
import './App.css';

const NOW = new Date().toISOString();

const FEATURED = {
  location: 'San Francisco, CA',
  temperature: 14,
  condition: 'Partly Cloudy',
  humidity: 78,
  windSpeed: 22,
  status: 'active',
  priority: 'high',
  updatedAt: NOW,
  description:
    'Marine layer clearing by midday. Expect fog along the coast through 10 AM, then partly cloudy skies into the evening.',
};

const STANDARD_CARDS = [
  {
    id: 1,
    location: 'New York, NY',
    temperature: 5,
    condition: 'Snow',
    high: 7,
    low: 1,
    status: 'warning',
    priority: 'high',
    updatedAt: NOW,
  },
  {
    id: 2,
    location: 'Austin, TX',
    temperature: 22,
    condition: 'Sunny',
    high: 25,
    low: 15,
    status: 'active',
    priority: 'medium',
    updatedAt: NOW,
  },
  {
    id: 3,
    location: 'Chicago, IL',
    temperature: -3,
    condition: 'Blizzard',
    high: 0,
    low: -8,
    status: 'error',
    priority: 'high',
    updatedAt: NOW,
  },
  {
    id: 4,
    location: 'Miami, FL',
    temperature: 29,
    condition: 'Thunderstorm',
    high: 31,
    low: 24,
    status: 'warning',
    priority: 'medium',
    updatedAt: NOW,
  },
];

const COMPACT_CARDS = [
  { id: 1, location: 'Seattle, WA',    temperature: 10, condition: 'Rain',          status: 'active',   priority: 'low',    updatedAt: NOW },
  { id: 2, location: 'Denver, CO',     temperature: 3,  condition: 'Snow showers',  status: 'warning',  priority: 'medium', updatedAt: NOW },
  { id: 3, location: 'Phoenix, AZ',    temperature: 24, condition: 'Clear',         status: 'active',   priority: 'low',    updatedAt: NOW },
  { id: 4, location: 'Boston, MA',     temperature: 2,  condition: 'Overcast',      status: 'inactive', priority: 'low',    updatedAt: NOW },
  { id: 5, location: 'Portland, OR',   temperature: 9,  condition: 'Drizzle',       status: 'active',   priority: 'low',    updatedAt: NOW },
  { id: 6, location: 'Las Vegas, NV',  temperature: 18, condition: 'Windy',         status: 'warning',  priority: 'medium', updatedAt: NOW },
];

function SectionLabel({ children }) {
  return <h3 className="section-label">{children}</h3>;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showEmpty, setShowEmpty] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div>
            <h1 className="app-title">Weather Dashboard</h1>
            <p className="app-subtitle">Real-time conditions · 5-day forecast</p>
          </div>
          <nav className="app-controls">
            <button
              className="ctrl-btn"
              onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1600); }}
            >
              Refresh
            </button>
            <button
              className={`ctrl-btn${showEmpty ? ' ctrl-btn--active' : ''}`}
              onClick={() => setShowEmpty(v => !v)}
            >
              {showEmpty ? 'Show Data' : 'Empty State'}
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {/* ── Featured + side grid ────────────────────────── */}
        <section className="section section--hero">
          <SectionLabel>Featured Location</SectionLabel>
          <div className="hero-layout">
            <div className="hero-featured">
              <FeaturedCard
                data={FEATURED}
                loading={isLoading}
                empty={showEmpty}
              />
            </div>

            <div className="hero-grid">
              {STANDARD_CARDS.map((card, i) => (
                <StandardCard
                  key={card.id}
                  data={card}
                  loading={isLoading}
                  empty={showEmpty}
                  disabled={i === 3}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Compact list ────────────────────────────────── */}
        <section className="section section--list">
          <SectionLabel>More Locations</SectionLabel>
          <div className="compact-layout">
            <div className="compact-col compact-col--wide">
              {COMPACT_CARDS.slice(0, 3).map(card => (
                <CompactCard key={card.id} data={card} loading={isLoading} empty={showEmpty} />
              ))}
            </div>
            <div className="compact-col compact-col--narrow">
              {COMPACT_CARDS.slice(3).map((card, i) => (
                <CompactCard
                  key={card.id}
                  data={card}
                  loading={isLoading}
                  empty={showEmpty}
                  disabled={i === 2}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── States showcase ─────────────────────────────── */}
        <section className="section section--states">
          <SectionLabel>Component States</SectionLabel>
          <div className="states-grid">
            <div className="states-group">
              <span className="state-title">Loading</span>
              <FeaturedCard loading />
            </div>
            <div className="states-group states-group--sm">
              <span className="state-title">Empty</span>
              <StandardCard empty />
            </div>
            <div className="states-group states-group--sm">
              <span className="state-title">Disabled</span>
              <StandardCard data={STANDARD_CARDS[1]} disabled />
            </div>
            <div className="states-group states-group--xs">
              <span className="state-title">Compact / Active</span>
              <CompactCard data={COMPACT_CARDS[0]} />
            </div>
            <div className="states-group states-group--xs">
              <span className="state-title">Compact / Empty</span>
              <CompactCard empty />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
