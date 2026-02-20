import { Droplets, Wind, Eye, Gauge, Thermometer } from "lucide-react";

const OWM_ICON = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

const C_TO_F = (c) => ((c * 9) / 5 + 32).toFixed(1);

export default function WeatherCard({ data }) {
  if (!data) return null;
  const { location, temperature, feels_like, temp_min, temp_max, humidity, pressure, wind_speed, visibility, description, icon } = data;

  return (
    <div className="card" style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.city}>{location.city || location.display_name.split(",")[0]}</h2>
          <p style={styles.country}>{location.country}</p>
          <p style={styles.coords}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>
        <div style={styles.iconBlock}>
          <img src={OWM_ICON(icon)} alt={description} style={styles.weatherIcon} />
          <p style={styles.desc}>{description}</p>
        </div>
      </div>

      {/* Main temp */}
      <div style={styles.tempBlock}>
        <span style={styles.temp}>{temperature.toFixed(1)}°C</span>
        <span style={styles.tempF}>{C_TO_F(temperature)}°F</span>
      </div>
      <div style={styles.feelsLike}>
        Feels like <strong>{feels_like.toFixed(1)}°C</strong> &nbsp;|&nbsp;
        Low <strong>{temp_min.toFixed(1)}°C</strong> &nbsp;/&nbsp;
        High <strong>{temp_max.toFixed(1)}°C</strong>
      </div>

      <hr className="divider" />

      {/* Details grid */}
      <div className="grid-4">
        <Stat icon={<Droplets size={18} color="#60a5fa" />} label="Humidity" value={`${humidity}%`} />
        <Stat icon={<Wind size={18} color="#34d399" />} label="Wind" value={`${wind_speed} m/s`} />
        <Stat icon={<Gauge size={18} color="#a78bfa" />} label="Pressure" value={`${pressure} hPa`} />
        <Stat icon={<Eye size={18} color="#fb923c" />} label="Visibility" value={`${(visibility / 1000).toFixed(1)} km`} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={statStyles.wrap}>
      <div style={statStyles.row}>
        {icon}
        <span style={statStyles.label}>{label}</span>
      </div>
      <span style={statStyles.value}>{value}</span>
    </div>
  );
}

const styles = {
  card: {
    background: "linear-gradient(135deg, #1a73e8 0%, #0f9d58 100%)",
    color: "#fff",
    borderRadius: 16,
    padding: "1.5rem",
    boxShadow: "0 8px 32px rgba(26,115,232,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    flexWrap: "wrap",
  },
  city: { fontSize: "1.6rem", fontWeight: 800, color: "#fff" },
  country: { opacity: 0.85, fontSize: "0.95rem" },
  coords: { opacity: 0.65, fontSize: "0.78rem", marginTop: 2 },
  iconBlock: { textAlign: "center" },
  weatherIcon: { width: 80, height: 80, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))" },
  desc: { opacity: 0.9, fontSize: "0.9rem", textTransform: "capitalize" },
  tempBlock: { display: "flex", alignItems: "baseline", gap: "0.75rem", marginTop: "0.75rem" },
  temp: { fontSize: "3.5rem", fontWeight: 800, lineHeight: 1 },
  tempF: { fontSize: "1.4rem", opacity: 0.8 },
  feelsLike: { opacity: 0.85, fontSize: "0.9rem", marginTop: "0.25rem" },
};

const statStyles = {
  wrap: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "0.75rem",
    backdropFilter: "blur(4px)",
  },
  row: { display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" },
  label: { fontSize: "0.78rem", opacity: 0.8 },
  value: { fontWeight: 700, fontSize: "1rem" },
};
