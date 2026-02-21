"""Integration tests for /integrations routes."""
import pytest
from unittest.mock import patch, MagicMock
from app.schemas.weather import GeocodingResult

MOCK_GEO = GeocodingResult(
    display_name="Paris, France",
    city="Paris",
    country="France",
    latitude=48.8566,
    longitude=2.3522,
)


class TestYouTubeEndpoint:
    def test_success(self, client):
        with patch("app.routers.integrations.geocode_location", return_value=MOCK_GEO), \
             patch("app.routers.integrations.get_youtube_videos", return_value=[
                 {"video_id": "v1", "title": "Paris Travel"}
             ]):
            resp = client.get("/integrations/youtube", params={"location": "Paris"})
            assert resp.status_code == 200
            body = resp.json()
            assert body["location"]["city"] == "Paris"
            assert len(body["videos"]) == 1

    def test_geocode_failure(self, client):
        with patch("app.routers.integrations.geocode_location", side_effect=ValueError("Not found")):
            resp = client.get("/integrations/youtube", params={"location": "xyz"})
            assert resp.status_code == 400

    def test_missing_param(self, client):
        resp = client.get("/integrations/youtube")
        assert resp.status_code == 422


class TestMapEndpoint:
    def test_success(self, client):
        with patch("app.routers.integrations.geocode_location", return_value=MOCK_GEO), \
             patch("app.routers.integrations.get_openstreetmap_embed_url", return_value="https://osm.org/embed"):
            resp = client.get("/integrations/map", params={"location": "Paris"})
            assert resp.status_code == 200
            body = resp.json()
            assert body["embed_url"] == "https://osm.org/embed"
            assert "osm_link" in body

    def test_geocode_failure(self, client):
        with patch("app.routers.integrations.geocode_location", side_effect=ValueError("Nope")):
            resp = client.get("/integrations/map", params={"location": "xyz"})
            assert resp.status_code == 400


class TestAirQualityEndpoint:
    def test_success(self, client):
        with patch("app.routers.integrations.geocode_location", return_value=MOCK_GEO), \
             patch("app.routers.integrations.get_air_quality", return_value={
                 "aqi": 25, "level": "Fair"
             }):
            resp = client.get("/integrations/air-quality", params={"location": "Paris"})
            assert resp.status_code == 200
            body = resp.json()
            assert body["air_quality"]["aqi"] == 25

    def test_geocode_failure(self, client):
        with patch("app.routers.integrations.geocode_location", side_effect=ValueError("Nope")):
            resp = client.get("/integrations/air-quality", params={"location": "xyz"})
            assert resp.status_code == 400
