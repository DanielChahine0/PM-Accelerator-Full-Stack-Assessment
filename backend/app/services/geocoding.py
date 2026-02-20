"""
Geocoding service using Nominatim (OpenStreetMap) - free, no API key required.
Resolves city names, zip codes, landmarks, GPS coordinates, etc.
"""
import requests
from typing import Optional
from app.schemas.weather import GeocodingResult

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {"User-Agent": "WeatherApp/1.0 (PM Accelerator Assessment)"}


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
    resp = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
    resp.raise_for_status()
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
    resp = requests.get(NOMINATIM_REVERSE_URL, params=params, headers=HEADERS, timeout=10)
    resp.raise_for_status()
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
