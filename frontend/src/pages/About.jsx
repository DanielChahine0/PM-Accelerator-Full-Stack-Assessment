import { ExternalLink } from "lucide-react";

export default function About() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="card">
          <h1 style={{ marginBottom: "0.5rem" }}>About This App</h1>
          <p className="text-muted mb-3">Built by Daniel Chahine for the PM Accelerator AI Engineer Intern Technical Assessment</p>

          <hr className="divider" />

          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ marginBottom: "0.75rem" }}>About PM Accelerator</h2>
            <p style={{ lineHeight: 1.7, marginBottom: "0.75rem" }}>
              <strong>Product Manager Accelerator</strong> is a global community dedicated to helping aspiring and current
              product managers accelerate their careers. Through mentorship, resources, structured programs, and
              real-world project experience, PM Accelerator bridges the gap between ambition and opportunity in the
              product management field.
            </p>
            <p style={{ lineHeight: 1.7, marginBottom: "1rem" }}>
              The organization connects candidates with industry leaders, provides hands-on project experience, and
              cultivates the skills needed to excel as a product manager in today's fast-moving tech landscape.
            </p>
            <a
              href="https://www.linkedin.com/school/pmaccelerator/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <ExternalLink size={15} />
              Visit PM Accelerator on LinkedIn
            </a>
          </section>

          <hr className="divider" />

          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ marginBottom: "0.75rem" }}>Technical Stack</h2>
            <div className="grid-2">
              <div>
                <h3 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>Frontend</h3>
                <ul style={listStyle}>
                  <li>React 19 + Vite</li>
                  <li>React Router v7</li>
                  <li>Axios (API client)</li>
                  <li>Lucide React (icons)</li>
                  <li>Responsive CSS Grid/Flexbox</li>
                </ul>
              </div>
              <div>
                <h3 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>Backend</h3>
                <ul style={listStyle}>
                  <li>FastAPI (Python)</li>
                  <li>PostgreSQL database</li>
                  <li>SQLAlchemy (sync ORM)</li>
                  <li>Alembic (migrations)</li>
                  <li>Pydantic v2 (validation)</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="divider" />

          <section>
            <h2 style={{ marginBottom: "0.75rem" }}>External APIs Used</h2>
            <ul style={{ ...listStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              <li>OpenWeatherMap — current weather &amp; forecasts</li>
              <li>Open-Meteo — historical weather (free, no key)</li>
              <li>Open-Meteo AQI — air quality index</li>
              <li>Nominatim (OpenStreetMap) — geocoding</li>
              <li>YouTube Data API v3 — location videos</li>
              <li>Google Maps Embed API — interactive maps</li>
              <li>OpenStreetMap — fallback map embed</li>
            </ul>
          </section>

          <hr className="divider" />

          <section>
            <h2 style={{ marginBottom: "0.75rem" }}>Features</h2>
            <ul style={listStyle}>
              <li>Real-time weather for any city, zip code, GPS coordinates, or landmark</li>
              <li>5-day weather forecast with precipitation probability</li>
              <li>Air quality index with health guidance</li>
              <li>Interactive map embed (Google Maps or OpenStreetMap)</li>
              <li>YouTube travel/weather videos for the location</li>
              <li>Full CRUD: save, view, edit, and delete weather records with date ranges</li>
              <li>Data export in JSON, CSV, XML, PDF, and Markdown</li>
              <li>Input validation: date range validation, fuzzy location resolution</li>
              <li>Responsive design for desktop, tablet, and mobile</li>
              <li>Graceful error handling with user-friendly messages</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

const listStyle = {
  paddingLeft: "1.2rem",
  lineHeight: 2,
  color: "var(--text)",
  fontSize: "0.9rem",
};
