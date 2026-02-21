"""
Geocoding service using Nominatim (OpenStreetMap) - free, no API key required.
Resolves city names, zip codes, landmarks, GPS coordinates, etc.
"""
import requests
import time
import logging
from typing import Optional
from app.schemas.weather import GeocodingResult
import os

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
DEFAULT_USER_AGENT = "PMAcceleratorWeatherDashboard/1.0"
USER_AGENT = os.getenv("NOMINATIM_USER_AGENT", DEFAULT_USER_AGENT)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "en",
}

# Simple rate limiter: track last request time
_last_request_time = 0.0


def _rate_limited_get(url: str, params: dict, retries: int = 2) -> requests.Response:
    """Make a GET request to Nominatim with rate limiting (max 1 req/sec) and retries."""
    global _last_request_time
    for attempt in range(retries + 1):
        # Respect Nominatim's 1 request/second policy
        elapsed = time.time() - _last_request_time
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
        _last_request_time = time.time()

        resp = requests.get(url, params=params, headers=HEADERS, timeout=10)
        if resp.status_code == 403:
            logger.warning(f"Nominatim 403 on attempt {attempt + 1}, retrying...")
            time.sleep(2 * (attempt + 1))
            continue
        resp.raise_for_status()
        return resp
    # Final attempt failed
    resp.raise_for_status()
    return resp  # unreachable but satisfies type checker


def geocode_location(query: str) -> GeocodingResult:
    """
    Resolve a free-text location query to lat/lon.
    Handles: city names, zip codes, GPS coords, landmarks, addresses.
    """
    query = query.strip()

    # If user entered raw GPS coords like "40.7128,-74.0060" or "40.7128, -74.0060"
    if _looks_like_coords(query):
        lat, lon = _parse_coords(query)
        return _reverse_geocode(lat, lon)

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
    }
    resp = _rate_limited_get(NOMINATIM_URL, params)
    results = resp.json()

    if not results:
        raise ValueError(f"Location not found: '{query}'. Please try a more specific name.")

    r = results[0]
    addr = r.get("address", {})
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("county")
        or addr.get("state")
    )
    return GeocodingResult(
        display_name=r["display_name"],
        city=city,
        country=addr.get("country"),
        latitude=float(r["lat"]),
        longitude=float(r["lon"]),
    )


def _reverse_geocode(lat: float, lon: float) -> GeocodingResult:
    params = {"lat": lat, "lon": lon, "format": "json", "addressdetails": 1}
    resp = _rate_limited_get(NOMINATIM_REVERSE_URL, params)
    r = resp.json()
    if "error" in r:
        raise ValueError(f"No location found for coordinates ({lat}, {lon})")
    addr = r.get("address", {})
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("county")
        or addr.get("state")
    )
    return GeocodingResult(
        display_name=r.get("display_name", f"{lat}, {lon}"),
        city=city,
        country=addr.get("country"),
        latitude=lat,
        longitude=lon,
    )


def _looks_like_coords(query: str) -> bool:
    parts = query.replace(" ", "").split(",")
    if len(parts) != 2:
        return False
    try:
        float(parts[0])
        float(parts[1])
        return True
    except ValueError:
        return False


def _parse_coords(query: str) -> tuple[float, float]:
    parts = query.replace(" ", "").split(",")
    return float(parts[0]), float(parts[1])
