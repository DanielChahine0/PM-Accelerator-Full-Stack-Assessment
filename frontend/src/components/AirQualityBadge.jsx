const LEVEL_COLORS = {
  Good: { bg: "#dcfce7", color: "#166534" },
  Fair: { bg: "#d1fae5", color: "#065f46" },
  Moderate: { bg: "#fef9c3", color: "#854d0e" },
  Poor: { bg: "#ffedd5", color: "#9a3412" },
  "Very Poor": { bg: "#fee2e2", color: "#991b1b" },
  "Extremely Poor": { bg: "#fce7f3", color: "#9d174d" },
};

export default function AirQualityBadge({ data }) {
  if (!data || !data.air_quality || Object.keys(data.air_quality).length === 0) return null;
  const { aqi, level, pm2_5, pm10, ozone } = data.air_quality;
  const colors = LEVEL_COLORS[level] || { bg: "#f1f5f9", color: "#475569" };

  return (
    <div className="card mt-2" style={{ padding: "1rem 1.5rem" }}>
      <h3 style={{ marginBottom: "0.75rem" }}>Air Quality</h3>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div
          style={{
            background: colors.bg,
            color: colors.color,
            borderRadius: 10,
            padding: "0.5rem 1.2rem",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          {level} &nbsp; (AQI {aqi})
        </div>
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
          {pm2_5 != null && <span>PM2.5: <strong>{pm2_5} μg/m³</strong></span>}
          {pm10 != null && <span>PM10: <strong>{pm10} μg/m³</strong></span>}
          {ozone != null && <span>O₃: <strong>{ozone} μg/m³</strong></span>}
        </div>
      </div>
    </div>
  );
}
