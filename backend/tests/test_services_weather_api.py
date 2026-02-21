"""Tests for weather_api service — mocked HTTP."""
import pytest
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from app.services.weather_api import (
    get_current_weather,
    get_forecast,
    get_historical_weather,
    build_weather_snapshot,
    _check_api_key,
    _handle_owm_error,
)
from app.schemas.weather import GeocodingResult


@pytest.fixture
def geo():
    return GeocodingResult(
        display_name="London, UK",
        city="London",
        country="United Kingdom",
        latitude=51.5074,
        longitude=-0.1278,
    )


# ── _check_api_key ──────────────────────────────────────────────────────────

class TestCheckApiKey:
    def test_raises_when_empty(self):
        with patch("app.services.weather_api.settings") as mock_settings:
            mock_settings.OPENWEATHER_API_KEY = ""
            with pytest.raises(ValueError, match="OPENWEATHER_API_KEY is not configured"):
                _check_api_key()

    def test_no_error_when_set(self):
        with patch("app.services.weather_api.settings") as mock_settings:
            mock_settings.OPENWEATHER_API_KEY = "valid-key"
            _check_api_key()  # should not raise


# ── _handle_owm_error ──────────────────────────────────────────────────────

class TestHandleOwmError:
    def test_401_raises(self):
        resp = MagicMock()
        resp.status_code = 401
        with pytest.raises(ValueError, match="Invalid OpenWeatherMap API key"):
            _handle_owm_error(resp)

    def test_404_raises(self):
        resp = MagicMock()
        resp.status_code = 404
        with pytest.raises(ValueError, match="Location not found"):
            _handle_owm_error(resp)

    def test_500_raises(self):
        resp = MagicMock()
        resp.status_code = 500
        resp.text = "Internal Server Error"
        with pytest.raises(ValueError, match="Weather API error"):
            _handle_owm_error(resp)

    def test_200_no_error(self):
        resp = MagicMock()
        resp.status_code = 200
        _handle_owm_error(resp)  # should not raise


# ── get_current_weather ─────────────────────────────────────────────────────

OWM_WEATHER_RESPONSE = {
    "main": {
        "temp": 15.5,
        "feels_like": 14.0,
        "temp_min": 13.0,
        "temp_max": 17.0,
        "humidity": 72,
        "pressure": 1013,
    },
    "wind": {"speed": 4.2},
    "visibility": 10000,
    "weather": [{"description": "overcast clouds", "icon": "04d"}],
    "dt": 1700000000,
}


class TestGetCurrentWeather:
    def test_success(self, geo):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = OWM_WEATHER_RESPONSE

        with patch("app.services.weather_api.settings") as mock_settings, \
             patch("app.services.weather_api.requests.get", return_value=mock_resp):
            mock_settings.OPENWEATHER_API_KEY = "test-key"
            result = get_current_weather(geo)
            assert result.temperature == 15.5
            assert result.description == "Overcast clouds"
            assert result.humidity == 72

    def test_no_api_key_raises(self, geo):
        with patch("app.services.weather_api.settings") as mock_settings:
            mock_settings.OPENWEATHER_API_KEY = ""
            with pytest.raises(ValueError, match="OPENWEATHER_API_KEY"):
                get_current_weather(geo)


# ── get_forecast ────────────────────────────────────────────────────────────

OWM_FORECAST_RESPONSE = {
    "list": [
        {
            "dt_txt": "2025-06-01 12:00:00",
            "main": {"temp": 20.0, "humidity": 55},
            "wind": {"speed": 3.5},
            "weather": [{"description": "clear sky", "icon": "01d"}],
            "pop": 0.1,
        },
        {
            "dt_txt": "2025-06-01 15:00:00",
            "main": {"temp": 22.0, "humidity": 50},
            "wind": {"speed": 4.0},
            "weather": [{"description": "clear sky", "icon": "01d"}],
            "pop": 0.05,
        },
        {
            "dt_txt": "2025-06-02 12:00:00",
            "main": {"temp": 18.0, "humidity": 65},
            "wind": {"speed": 5.0},
            "weather": [{"description": "light rain", "icon": "10d"}],
            "pop": 0.8,
        },
    ]
}


class TestGetForecast:
    def test_aggregates_by_day(self, geo):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = OWM_FORECAST_RESPONSE

        with patch("app.services.weather_api.settings") as mock_settings, \
             patch("app.services.weather_api.requests.get", return_value=mock_resp):
            mock_settings.OPENWEATHER_API_KEY = "test-key"
            result = get_forecast(geo)
            assert len(result.forecast) == 2  # 2 distinct days
            day1 = result.forecast[0]
            assert day1.date == "2025-06-01"
            assert day1.temp_min == 20.0  # min of [20, 22]
            assert day1.temp_max == 22.0  # max of [20, 22]


# ── get_historical_weather ──────────────────────────────────────────────────

class TestGetHistoricalWeather:
    def test_success(self, geo):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "daily": {
                "temperature_2m_max": [10.0, 12.0],
                "temperature_2m_min": [5.0, 6.0],
            }
        }

        with patch("app.services.weather_api.requests.get", return_value=mock_resp):
            result = get_historical_weather(geo, date(2024, 1, 1), date(2024, 1, 2))
            assert "daily" in result

    def test_non_200_raises(self, geo):
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.text = "Bad Request"

        with patch("app.services.weather_api.requests.get", return_value=mock_resp):
            with pytest.raises(ValueError, match="Historical weather unavailable"):
                get_historical_weather(geo, date(2024, 1, 1), date(2024, 1, 2))


# ── build_weather_snapshot ──────────────────────────────────────────────────

class TestBuildWeatherSnapshot:
    def test_future_uses_current_weather(self, geo):
        future = date.today() + timedelta(days=5)
        future_end = future + timedelta(days=2)

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = OWM_WEATHER_RESPONSE

        with patch("app.services.weather_api.settings") as mock_settings, \
             patch("app.services.weather_api.requests.get", return_value=mock_resp):
            mock_settings.OPENWEATHER_API_KEY = "test-key"
            snapshot = build_weather_snapshot(geo, future, future_end)
            assert snapshot["temperature_avg"] == 15.5
            assert snapshot["description"] == "Overcast clouds"

    def test_past_uses_historical(self, geo):
        past_start = date(2024, 1, 1)
        past_end = date(2024, 1, 5)

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "daily": {
                "temperature_2m_max": [10.0, 12.0, 11.0],
                "temperature_2m_min": [3.0, 5.0, 4.0],
                "temperature_2m_mean": [6.5, 8.0, 7.0],
                "relative_humidity_2m_max": [80, 75, 85],
                "windspeed_10m_max": [5.0, 6.0, 4.5],
            }
        }

        with patch("app.services.weather_api.requests.get", return_value=mock_resp):
            snapshot = build_weather_snapshot(geo, past_start, past_end)
            assert snapshot["temperature_min"] == 3.0
            assert snapshot["temperature_max"] == 12.0
            assert snapshot["description"] == "Historical data"

    def test_api_failure_returns_empty(self, geo):
        future = date.today() + timedelta(days=5)

        with patch("app.services.weather_api.settings") as mock_settings, \
             patch("app.services.weather_api.requests.get", side_effect=Exception("fail")):
            mock_settings.OPENWEATHER_API_KEY = "test-key"
            snapshot = build_weather_snapshot(geo, future, future + timedelta(days=1))
            assert snapshot == {}
