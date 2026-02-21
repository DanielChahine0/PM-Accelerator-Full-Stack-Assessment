"""
Geocoding service using Nominatim (OpenStreetMap) - free, no API key required.
Resolves city names, zip codes, landmarks, GPS coordinates, etc.
"""
import requests
import time
import logging
import threading
from typing import Optional, Tuple
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

# ── In-memory TTL cache for geocoding results ──────────────────────────────
# Avoids re-geocoding the same query across concurrent requests (e.g. 5
# frontend calls all asking for the same city).  Entries expire after 1 hour.
_CACHE_TTL = 3600  # seconds
_geo_cache: dict[str, Tuple[float, GeocodingResult]] = {}  # key → (timestamp, result)
_cache_lock = threading.Lock()


def _cache_get(key: str) -> Optional[GeocodingResult]:
    """Return cached GeocodingResult if still valid, else None."""
    with _cache_lock:
        entry = _geo_cache.get(key)
        if entry is None:
            return None
        ts, result = entry
        if time.time() - ts > _CACHE_TTL:
            del _geo_cache[key]
            return None
        return result


def _cache_set(key: str, result: GeocodingResult) -> None:
    """Store a geocoding result in the cache."""
    with _cache_lock:
        _geo_cache[key] = (time.time(), result)
        # Evict oldest entries if cache grows too large
        if len(_geo_cache) > 500:
            oldest_key = min(_geo_cache, key=lambda k: _geo_cache[k][0])
            del _geo_cache[oldest_key]


def _rate_limited_get(url: str, params: dict, retries: int = 2) -> requests.Response:
    """Make a GET request to Nominatim with rate limiting (max 1 req/sec) and retries."""
    global _last_request_time
    for attempt in range(retries + 1):
        # Respect Nominatim's 1 request/second policy
        elapsed = time.time() - _last_request_time
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
        _last_request_time = time.time()

        resp = requests.get(url, params=params, headers=HEADERS, timeout=8)
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
    Results are cached in-memory for 1 hour to avoid redundant API calls.
    """
    query = query.strip()
    cache_key = query.lower()

    # Check cache first — avoids hitting rate limiter for repeated queries
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug(f"Geocoding cache hit for '{query}'")
        return cached

    # If user entered raw GPS coords like "40.7128,-74.0060" or "40.7128, -74.0060"
    if _looks_like_coords(query):
        lat, lon = _parse_coords(query)
        result = _reverse_geocode(lat, lon)
        _cache_set(cache_key, result)
        return result

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
    result = GeocodingResult(
        display_name=r["display_name"],
        city=city,
        country=addr.get("country"),
        latitude=float(r["lat"]),
        longitude=float(r["lon"]),
    )
    _cache_set(cache_key, result)
    return result


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
