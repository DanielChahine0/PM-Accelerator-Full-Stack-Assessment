"""
Weather service using OpenWeatherMap API for current/forecast
and Open-Meteo API for historical data (free, no key needed).
"""
import requests
from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas.weather import GeocodingResult, CurrentWeatherResponse, ForecastResponse, ForecastDay

OWM_BASE = "https://api.openweathermap.org/data/2.5"
OWM_ICON_URL = "https://openweathermap.org/img/wn/{icon}@2x.png"
OPEN_METEO_BASE = "https://api.open-meteo.com/v1"


def get_current_weather(geo: GeocodingResult) -> CurrentWeatherResponse:
    """Fetch current weather from OpenWeatherMap."""
    _check_api_key()
    params = {
        "lat": geo.latitude,
        "lon": geo.longitude,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric",
    }
    resp = requests.get(f"{OWM_BASE}/weather", params=params, timeout=10)
    _handle_owm_error(resp)
    d = resp.json()
    return CurrentWeatherResponse(
        location=geo,
        temperature=d["main"]["temp"],
        feels_like=d["main"]["feels_like"],
        temp_min=d["main"]["temp_min"],
        temp_max=d["main"]["temp_max"],
        humidity=d["main"]["humidity"],
        pressure=d["main"]["pressure"],
        wind_speed=d["wind"]["speed"],
        visibility=d.get("visibility", 0),
        description=d["weather"][0]["description"].capitalize(),
        icon=d["weather"][0]["icon"],
        dt=d["dt"],
    )


def get_forecast(geo: GeocodingResult) -> ForecastResponse:
    """Fetch 5-day / 3-hour forecast from OpenWeatherMap, aggregated by day."""
    _check_api_key()
    params = {
        "lat": geo.latitude,
        "lon": geo.longitude,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40,  # 5 days × 8 readings
    }
    resp = requests.get(f"{OWM_BASE}/forecast", params=params, timeout=10)
    _handle_owm_error(resp)
    data = resp.json()

    # Aggregate into daily buckets
    daily: Dict[str, Dict] = {}
    for item in data["list"]:
        day_str = item["dt_txt"][:10]
        if day_str not in daily:
            daily[day_str] = {
                "temps": [],
                "humidity": [],
                "wind": [],
                "descriptions": [],
                "icons": [],
                "pop": [],
            }
        bucket = daily[day_str]
        bucket["temps"].append(item["main"]["temp"])
        bucket["humidity"].append(item["main"]["humidity"])
        bucket["wind"].append(item["wind"]["speed"])
        bucket["descriptions"].append(item["weather"][0]["description"].capitalize())
        bucket["icons"].append(item["weather"][0]["icon"])
        bucket["pop"].append(item.get("pop", 0))

    forecast_days: List[ForecastDay] = []
    for day_str, bucket in list(daily.items())[:5]:
        # Pick the most common description/icon for the day
        desc = max(set(bucket["descriptions"]), key=bucket["descriptions"].count)
        icon = max(set(bucket["icons"]), key=bucket["icons"].count)
        forecast_days.append(
            ForecastDay(
                date=day_str,
                temp_min=round(min(bucket["temps"]), 1),
                temp_max=round(max(bucket["temps"]), 1),
                description=desc,
                icon=icon,
                humidity=round(sum(bucket["humidity"]) / len(bucket["humidity"]), 1),
                wind_speed=round(sum(bucket["wind"]) / len(bucket["wind"]), 1),
                pop=round(max(bucket["pop"]) * 100, 0),
            )
        )

    return ForecastResponse(location=geo, forecast=forecast_days)


def get_historical_weather(geo: GeocodingResult, date_from: date, date_to: date) -> Dict[str, Any]:
    """
    Fetch historical weather using Open-Meteo (free, no API key).
    Returns daily summary data for the given date range.
    """
    params = {
        "latitude": geo.latitude,
        "longitude": geo.longitude,
        "start_date": str(date_from),
        "end_date": str(date_to),
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "precipitation_sum",
            "windspeed_10m_max",
            "relative_humidity_2m_max",
        ],
        "timezone": "auto",
    }
    resp = requests.get(f"{OPEN_METEO_BASE}/archive", params=params, timeout=15)
    if resp.status_code != 200:
        raise ValueError(f"Historical weather unavailable: {resp.text}")
    return resp.json()


def get_weather_for_date_range(geo: GeocodingResult, date_from: date, date_to: date) -> Dict[str, Any]:
    """
    Smart fetch: use current/forecast for near-future dates,
    historical archive for past dates.
    """
    today = date.today()
    result: Dict[str, Any] = {}

    # Determine if any part is historical (past)
    if date_from <= today:
        hist_end = min(date_to, today)
        try:
            hist = get_historical_weather(geo, date_from, hist_end)
            result["historical"] = hist
        except Exception as e:
            result["historical_error"] = str(e)

    # Determine if any part is future (forecast)
    if date_to > today:
        try:
            forecast = get_forecast(geo)
            result["forecast"] = [f.model_dump() for f in forecast.forecast]
        except Exception as e:
            result["forecast_error"] = str(e)

    return result


def build_weather_snapshot(geo: GeocodingResult, date_from: date, date_to: date) -> Dict[str, Any]:
    """
    Build the summary fields stored in WeatherRecord from API data.
    Returns a dict with temp_min/max/avg, humidity, wind_speed, etc.
    """
    today = date.today()
    snapshot: Dict[str, Any] = {}

    # Use current weather as primary data point for current/future queries
    if date_from >= today:
        try:
            current = get_current_weather(geo)
            snapshot = {
                "temperature_min": current.temp_min,
                "temperature_max": current.temp_max,
                "temperature_avg": current.temperature,
                "humidity": current.humidity,
                "wind_speed": current.wind_speed,
                "description": current.description,
                "weather_icon": current.icon,
                "feels_like": current.feels_like,
                "pressure": current.pressure,
                "visibility": current.visibility,
            }
        except Exception:
            pass
    else:
        # Use historical data
        try:
            hist = get_historical_weather(geo, date_from, min(date_to, today))
            daily = hist.get("daily", {})
            temps_max = [t for t in daily.get("temperature_2m_max", []) if t is not None]
            temps_min = [t for t in daily.get("temperature_2m_min", []) if t is not None]
            temps_avg = [t for t in daily.get("temperature_2m_mean", []) if t is not None]
            humidity = [h for h in daily.get("relative_humidity_2m_max", []) if h is not None]
            wind = [w for w in daily.get("windspeed_10m_max", []) if w is not None]

            snapshot = {
                "temperature_min": round(min(temps_min), 1) if temps_min else None,
                "temperature_max": round(max(temps_max), 1) if temps_max else None,
                "temperature_avg": round(sum(temps_avg) / len(temps_avg), 1) if temps_avg else None,
                "humidity": round(sum(humidity) / len(humidity), 1) if humidity else None,
                "wind_speed": round(sum(wind) / len(wind), 1) if wind else None,
                "description": "Historical data",
                "weather_icon": "01d",
            }
        except Exception:
            pass

    return snapshot


def _check_api_key():
    if not settings.OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not configured. Add it to your .env file.")


def _handle_owm_error(resp: requests.Response):
    if resp.status_code == 401:
        raise ValueError("Invalid OpenWeatherMap API key.")
    if resp.status_code == 404:
        raise ValueError("Location not found by weather service.")
    if resp.status_code != 200:
        raise ValueError(f"Weather API error ({resp.status_code}): {resp.text}")
