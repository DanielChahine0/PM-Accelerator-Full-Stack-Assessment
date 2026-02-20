"""
Additional API integrations: YouTube, Maps, Air Quality.
"""
from fastapi import APIRouter, Query, HTTPException
from app.services.geocoding import geocode_location
from app.services.integrations import (
    get_youtube_videos,
    get_google_maps_embed_url,
    get_openstreetmap_url,
    get_air_quality,
)

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/youtube")
def youtube_videos(location: str = Query(...), max_results: int = Query(4, ge=1, le=10)):
    """Search YouTube for travel/weather videos about a location."""
    try:
        geo = geocode_location(location)
        videos = get_youtube_videos(geo.display_name, max_results)
        return {"location": geo, "videos": videos}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/map")
def map_embed(location: str = Query(...)):
    """Get map embed URLs (Google Maps or OpenStreetMap fallback) for a location."""
    try:
        geo = geocode_location(location)
        google_url = get_google_maps_embed_url(geo.latitude, geo.longitude)
        osm_url = get_openstreetmap_url(geo.latitude, geo.longitude)
        return {
            "location": geo,
            "google_maps_embed_url": google_url,
            "openstreetmap_embed_url": osm_url,
            "google_maps_link": f"https://maps.google.com/?q={geo.latitude},{geo.longitude}",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/air-quality")
def air_quality(location: str = Query(...)):
    """Get current air quality index for a location."""
    try:
        geo = geocode_location(location)
        aqi = get_air_quality(geo.latitude, geo.longitude)
        return {"location": geo, "air_quality": aqi}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
