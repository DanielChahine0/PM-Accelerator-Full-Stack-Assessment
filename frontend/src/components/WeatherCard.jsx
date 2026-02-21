import { Droplets, Wind, Eye, Gauge } from "lucide-react";
import FeaturedCard from "./FeaturedCard";
import CompactCard from "./CompactCard";

const OWM_ICON = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
const C_TO_F = (c) => ((c * 9) / 5 + 32).toFixed(1);

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function WeatherCard({ data, loading = false }) {
  if (loading) {
    return <FeaturedCard loading title="Weather" />;
  }
  if (!data) return null;

  const { location, temperature, feels_like, temp_min, temp_max, humidity, pressure, wind_speed, visibility, description, icon } = data;
  const cityName = location.city || location.display_name?.split(",")[0];

  return (
    <FeaturedCard
      title={cityName}
      subtitle={`${location.country} · ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
      status="active"
      priority="high"
      updatedAt={formatTime()}
    >
      {/* Top section: icon + temp */}
      <div className="weather-hero">
        <div className="weather-hero__temp-group">
          <img src={OWM_ICON(icon)} alt={description} className="weather-hero__icon" />
          <div>
            <span className="weather-hero__temp">{temperature.toFixed(1)}°C</span>
            <span className="weather-hero__temp-f">{C_TO_F(temperature)}°F</span>
          </div>
        </div>
        <p className="weather-hero__desc">{description}</p>
        <p className="weather-hero__feels">
          Feels like {feels_like.toFixed(1)}°C · Low {temp_min.toFixed(1)}° / High {temp_max.toFixed(1)}°
        </p>
      </div>

      {/* Compact stat list — asymmetric, not uniform grid */}
      <div className="weather-stats">
        <CompactCard
          icon={<Droplets size={14} color="#60a5fa" />}
          label="Humidity"
          value={`${humidity}%`}
          status="active"
        />
        <CompactCard
          icon={<Wind size={14} color="#34d399" />}
          label="Wind"
          value={`${wind_speed} m/s`}
        />
        <CompactCard
          icon={<Gauge size={14} color="#a78bfa" />}
          label="Pressure"
          value={`${pressure} hPa`}
        />
        <CompactCard
          icon={<Eye size={14} color="#fb923c" />}
          label="Visibility"
          value={`${(visibility / 1000).toFixed(1)} km`}
        />
      </div>
    </FeaturedCard>
  );
}
