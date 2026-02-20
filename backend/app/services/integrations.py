"""
Additional API integrations:
- YouTube Data API v3 (location videos)
- Google Maps Embed (static map URL builder)
- Air Quality (Open-Meteo AQI - free)
"""
import requests
from typing import List, Dict, Any, Optional
from app.core.config import settings


# ---------------------------------------------------------------------------
# YouTube
# ---------------------------------------------------------------------------

def get_youtube_videos(location_name: str, max_results: int = 4) -> List[Dict[str, Any]]:
    """Search YouTube for travel/weather videos about the location."""
    if not settings.YOUTUBE_API_KEY:
        return []

    params = {
        "part": "snippet",
        "q": f"{location_name} travel weather",
        "type": "video",
        "maxResults": max_results,
        "key": settings.YOUTUBE_API_KEY,
        "relevanceLanguage": "en",
        "safeSearch": "strict",
    }
    try:
        resp = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        return [
            {
                "video_id": item["id"]["videoId"],
                "title": item["snippet"]["title"],
                "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                "channel": item["snippet"]["channelTitle"],
                "published_at": item["snippet"]["publishedAt"],
                "embed_url": f"https://www.youtube.com/embed/{item['id']['videoId']}",
                "watch_url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
            }
            for item in items
            if item.get("id", {}).get("videoId")
        ]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Google Maps
# ---------------------------------------------------------------------------

def get_google_maps_embed_url(latitude: float, longitude: float, zoom: int = 12) -> Optional[str]:
    """Build a Google Maps Embed API URL (requires API key with Maps Embed enabled)."""
    if not settings.GOOGLE_MAPS_API_KEY:
        return None
    return (
        f"https://www.google.com/maps/embed/v1/view"
        f"?key={settings.GOOGLE_MAPS_API_KEY}"
        f"&center={latitude},{longitude}"
        f"&zoom={zoom}"
        f"&maptype=roadmap"
    )


def get_openstreetmap_url(latitude: float, longitude: float) -> str:
    """Fallback map embed using OpenStreetMap (no key required)."""
    return (
        f"https://www.openstreetmap.org/export/embed.html"
        f"?bbox={longitude - 0.1},{latitude - 0.1},{longitude + 0.1},{latitude + 0.1}"
        f"&layer=mapnik"
        f"&marker={latitude},{longitude}"
    )


# ---------------------------------------------------------------------------
# Air Quality (Open-Meteo - free)
# ---------------------------------------------------------------------------

def get_air_quality(latitude: float, longitude: float) -> Dict[str, Any]:
    """Fetch current air quality index using Open-Meteo AQI (free, no key)."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["european_aqi", "us_aqi", "pm10", "pm2_5", "carbon_monoxide", "ozone"],
        "timezone": "auto",
    }
    try:
        resp = requests.get(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params=params,
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            current = data.get("current", {})
            aqi = current.get("european_aqi") or current.get("us_aqi") or 0
            return {
                "aqi": aqi,
                "us_aqi": current.get("us_aqi"),
                "european_aqi": current.get("european_aqi"),
                "pm10": current.get("pm10"),
                "pm2_5": current.get("pm2_5"),
                "ozone": current.get("ozone"),
                "level": _aqi_level(aqi),
            }
    except Exception:
        pass
    return {}


def _aqi_level(aqi: int) -> str:
    if aqi <= 20:
        return "Good"
    if aqi <= 40:
        return "Fair"
    if aqi <= 60:
        return "Moderate"
    if aqi <= 80:
        return "Poor"
    if aqi <= 100:
        return "Very Poor"
    return "Extremely Poor"
