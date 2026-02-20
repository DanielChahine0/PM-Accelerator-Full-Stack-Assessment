const OWM_ICON = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
const C_TO_F = (c) => ((c * 9) / 5 + 32).toFixed(0);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayName(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[d.getDay()];
}

export default function ForecastCard({ data }) {
  if (!data || !data.forecast || data.forecast.length === 0) return null;

  return (
    <div className="card mt-2">
      <h3 style={{ marginBottom: "1rem", color: "var(--text)" }}>5-Day Forecast</h3>
      <div className="grid-5">
        {data.forecast.map((day) => (
          <DayTile key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayTile({ day }) {
  return (
    <div style={styles.tile}>
      <p style={styles.dayName}>{getDayName(day.date)}</p>
      <p style={styles.dateStr}>{day.date.slice(5)}</p>
      <img src={OWM_ICON(day.icon)} alt={day.description} style={styles.icon} />
      <p style={styles.desc}>{day.description}</p>
      <div style={styles.temps}>
        <span style={styles.high}>{day.temp_max}°C</span>
        <span style={styles.low}>{day.temp_min}°C</span>
      </div>
      <div style={styles.extras}>
        <span>💧 {day.humidity}%</span>
        <span>🌧 {day.pop}%</span>
        <span>💨 {day.wind_speed}m/s</span>
      </div>
    </div>
  );
}

const styles = {
  tile: {
    background: "var(--surface-alt)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "0.75rem 0.5rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.2rem",
  },
  dayName: { fontWeight: 700, fontSize: "0.9rem", color: "var(--primary)" },
  dateStr: { fontSize: "0.75rem", color: "var(--text-muted)" },
  icon: { width: 52, height: 52 },
  desc: { fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.3 },
  temps: { display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.2rem" },
  high: { fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" },
  low: { fontSize: "0.85rem", color: "var(--text-muted)" },
  extras: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    marginTop: "0.3rem",
  },
};
