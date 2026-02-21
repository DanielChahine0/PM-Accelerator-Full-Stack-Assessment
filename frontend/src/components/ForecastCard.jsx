import StandardCard from "./StandardCard";

const OWM_ICON = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
const C_TO_F = (c) => ((c * 9) / 5 + 32).toFixed(0);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayName(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[d.getDay()];
}

export default function ForecastCard({ data, loading = false }) {
  if (loading) {
    return (
      <StandardCard loading title="Forecast" className="mt-2" />
    );
  }
  if (!data || !data.forecast || data.forecast.length === 0) return null;

  const [first, ...rest] = data.forecast;

  return (
    <div className="forecast-section mt-2">
      <h3 className="forecast-section__heading">5-Day Forecast</h3>

      {/* Featured first day — wider */}
      <div className="forecast-layout">
        <div className="forecast-layout__featured">
          <StandardCard title={`${getDayName(first.date)} — ${first.date.slice(5)}`} status="active">
            <div className="forecast-featured-day">
              <img src={OWM_ICON(first.icon)} alt={first.description} className="forecast-featured-day__icon" />
              <div className="forecast-featured-day__temps">
                <span className="forecast-featured-day__high">{first.temp_max}°C</span>
                <span className="forecast-featured-day__low">{first.temp_min}°C</span>
              </div>
              <p className="forecast-featured-day__desc">{first.description}</p>
              <div className="forecast-featured-day__meta">
                <span>Humidity {first.humidity}%</span>
                <span>Rain {first.pop}%</span>
                <span>Wind {first.wind_speed} m/s</span>
              </div>
            </div>
          </StandardCard>
        </div>

        {/* Remaining days — compact list, not uniform grid */}
        <div className="forecast-layout__rest">
          {rest.map((day) => (
            <div key={day.date} className="forecast-compact-day">
              <div className="forecast-compact-day__left">
                <img src={OWM_ICON(day.icon)} alt={day.description} className="forecast-compact-day__icon" />
                <div>
                  <span className="forecast-compact-day__name">{getDayName(day.date)}</span>
                  <span className="forecast-compact-day__date">{day.date.slice(5)}</span>
                </div>
              </div>
              <span className="forecast-compact-day__desc">{day.description}</span>
              <div className="forecast-compact-day__right">
                <span className="forecast-compact-day__high">{day.temp_max}°</span>
                <span className="forecast-compact-day__low">{day.temp_min}°</span>
                <span className="forecast-compact-day__pop">{day.pop}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
