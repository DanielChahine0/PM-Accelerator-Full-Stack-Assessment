import { useState, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import WeatherCard from "../components/WeatherCard";
import ForecastCard from "../components/ForecastCard";
import AirQualityBadge from "../components/AirQualityBadge";
import MapEmbed from "../components/MapEmbed";
import YouTubeVideos from "../components/YouTubeVideos";
import SaveWeatherForm from "../components/SaveWeatherForm";
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
      // Primary: current weather (required)
      const [w, f] = await Promise.all([
        getCurrentWeather(location),
        getForecast(location).catch(() => null),
      ]);
      setWeather(w);
      setForecast(f);

      // Secondary: enrichment data (non-blocking)
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
        {/* Hero search */}
        <div className="card mb-3" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Weather App</h1>
          <p className="text-muted mb-2">
            Enter any city, zip code, landmark, or GPS coordinates to get real-time weather.
          </p>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="error-box mb-2">{error}</div>
        )}

        {/* Results */}
        {weather && !loading && (
          <>
            <WeatherCard data={weather} />
            {forecast && <ForecastCard data={forecast} />}
            {airQuality && <AirQualityBadge data={airQuality} />}
            <SaveWeatherForm locationQuery={query} />
            {mapData && <MapEmbed data={mapData} />}
            {videos && <YouTubeVideos data={videos} />}
          </>
        )}

        {/* Empty state */}
        {!weather && !loading && !error && (
          <div className="empty-state">
            <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🌤</p>
            <p>Search for a location above to see current weather, forecast, map, and more.</p>
          </div>
        )}
      </div>
    </main>
  );
}
