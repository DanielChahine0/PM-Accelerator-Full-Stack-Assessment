import { useState, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import WeatherCard from "../components/WeatherCard";
import ForecastCard from "../components/ForecastCard";
import AirQualityBadge from "../components/AirQualityBadge";
import MapEmbed from "../components/MapEmbed";
import YouTubeVideos from "../components/YouTubeVideos";
import SaveWeatherForm from "../components/SaveWeatherForm";
import StandardCard from "../components/StandardCard";
import { getCurrentWeather, getForecast, getAirQuality, getMapData, getYouTubeVideos } from "../services/api";
import toast from "react-hot-toast";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [videos, setVideos] = useState(null);

  const handleSearch = useCallback(async (location) => {
    setQuery(location);
    setLoading(true);
    setError("");
    setWeather(null);
    setForecast(null);
    setAirQuality(null);
    setMapData(null);
    setVideos(null);

    try {
      const [w, f] = await Promise.all([
        getCurrentWeather(location),
        getForecast(location).catch(() => null),
      ]);
      setWeather(w);
      setForecast(f);

      Promise.all([
        getAirQuality(location).catch(() => null),
        getMapData(location).catch(() => null),
        getYouTubeVideos(location).catch(() => null),
      ]).then(([aq, map, yt]) => {
        setAirQuality(aq);
        setMapData(map);
        setVideos(yt);
      });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Could not fetch weather data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="page">
      <div className="container">
        {/* Search section — plain, no card wrapper */}
        <section className="search-section mb-3">
          <h1 className="search-section__title">Weather</h1>
          <p className="search-section__hint">
            City, zip code, landmark, or GPS coordinates.
          </p>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </section>

        {/* Loading skeletons */}
        {loading && (
          <div className="results-layout">
            <div className="results-layout__primary">
              <WeatherCard loading />
            </div>
            <aside className="results-layout__sidebar">
              <StandardCard loading />
              <StandardCard loading />
            </aside>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="error-box mb-2">{error}</div>
        )}

        {/* Results — asymmetric 2-column layout */}
        {weather && !loading && (
          <div className="results-layout">
            {/* Primary column — featured weather + forecast */}
            <div className="results-layout__primary">
              <WeatherCard data={weather} />
              <ForecastCard data={forecast} />
            </div>

            {/* Sidebar — smaller cards grouped */}
            <aside className="results-layout__sidebar">
              <AirQualityBadge data={airQuality} />
              <SaveWeatherForm locationQuery={query} />
              {mapData && <MapEmbed data={mapData} />}
            </aside>
          </div>
        )}

        {/* Videos — full width below */}
        {videos && !loading && <YouTubeVideos data={videos} />}

        {/* Empty state */}
        {!weather && !loading && !error && (
          <div className="empty-state">
            <p className="empty-state__text">Search for a location to see weather data.</p>
          </div>
        )}
      </div>
    </main>
  );
}
