import StandardCard from "./StandardCard";
import CompactCard from "./CompactCard";

const LEVEL_STATUS = {
  Good: "active",
  Fair: "active",
  Moderate: "stale",
  Poor: "error",
  "Very Poor": "error",
  "Extremely Poor": "error",
};

export default function AirQualityBadge({ data, loading = false }) {
  if (loading) {
    return <StandardCard loading title="Air Quality" className="mt-2" />;
  }
  if (!data || !data.air_quality || Object.keys(data.air_quality).length === 0) return null;
  const { aqi, level, pm2_5, pm10, ozone } = data.air_quality;
  const status = LEVEL_STATUS[level] || "stale";

  return (
    <StandardCard title="Air Quality" status={status} className="mt-2">
      <div className="aqi-layout">
        <div className="aqi-badge">
          <span className="aqi-badge__level">{level}</span>
          <span className="aqi-badge__index">AQI {aqi}</span>
        </div>
        <div className="aqi-readings">
          {pm2_5 != null && (
            <CompactCard label="PM2.5" value={`${pm2_5} μg/m³`} />
          )}
          {pm10 != null && (
            <CompactCard label="PM10" value={`${pm10} μg/m³`} />
          )}
          {ozone != null && (
            <CompactCard label="O₃" value={`${ozone} μg/m³`} />
          )}
        </div>
      </div>
    </StandardCard>
  );
}
