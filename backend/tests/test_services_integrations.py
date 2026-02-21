"""Tests for the integrations service — mocked HTTP."""
import pytest
from unittest.mock import patch, MagicMock
from app.services.integrations import (
    get_youtube_videos,
    get_openstreetmap_embed_url,
    get_air_quality,
    _aqi_level,
)


# ── _aqi_level (pure function) ─────────────────────────────────────────────

class TestAqiLevel:
    @pytest.mark.parametrize("aqi,expected", [
        (0, "Good"),
        (20, "Good"),
        (21, "Fair"),
        (40, "Fair"),
        (41, "Moderate"),
        (60, "Moderate"),
        (61, "Poor"),
        (80, "Poor"),
        (81, "Very Poor"),
        (100, "Very Poor"),
        (101, "Extremely Poor"),
        (500, "Extremely Poor"),
    ])
    def test_all_levels(self, aqi, expected):
        assert _aqi_level(aqi) == expected


# ── get_openstreetmap_embed_url (no HTTP) ───────────────────────────────────

class TestOpenStreetMapEmbedUrl:
    def test_returns_valid_url(self):
        url = get_openstreetmap_embed_url(40.7128, -74.006)
        assert "openstreetmap.org/export/embed.html" in url
        assert "marker=40.7128,-74.006" in url

    def test_bbox_contains_offsets(self):
        url = get_openstreetmap_embed_url(51.5, -0.1)
        # Should have bbox with ±0.1 offsets
        assert "bbox=" in url


# ── get_youtube_videos ──────────────────────────────────────────────────────

class TestGetYoutubeVideos:
    def test_returns_empty_when_no_api_key(self):
        """When YOUTUBE_API_KEY is empty, should return [] without calling API."""
        with patch("app.services.integrations.settings") as mock_settings:
            mock_settings.YOUTUBE_API_KEY = ""
            result = get_youtube_videos("New York", 4)
            assert result == []

    def test_returns_videos_on_success(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "id": {"videoId": "abc123"},
                    "snippet": {
                        "title": "NYC Travel Guide",
                        "thumbnails": {"medium": {"url": "https://img.youtube.com/abc.jpg"}},
                        "channelTitle": "TravelChannel",
                        "publishedAt": "2025-01-01T00:00:00Z",
                    },
                }
            ]
        }

        with patch("app.services.integrations.settings") as mock_settings, \
             patch("app.services.integrations.requests.get", return_value=mock_resp):
            mock_settings.YOUTUBE_API_KEY = "fake-key"
            result = get_youtube_videos("New York", 4)
            assert len(result) == 1
            assert result[0]["video_id"] == "abc123"
            assert result[0]["embed_url"] == "https://www.youtube.com/embed/abc123"

    def test_returns_empty_on_api_error(self):
        with patch("app.services.integrations.settings") as mock_settings, \
             patch("app.services.integrations.requests.get", side_effect=Exception("network error")):
            mock_settings.YOUTUBE_API_KEY = "fake-key"
            result = get_youtube_videos("New York", 4)
            assert result == []


# ── get_air_quality ─────────────────────────────────────────────────────────

class TestGetAirQuality:
    def test_returns_aqi_data(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "current": {
                "european_aqi": 35,
                "us_aqi": 42,
                "pm10": 20.0,
                "pm2_5": 10.0,
                "ozone": 55.0,
            }
        }

        with patch("app.services.integrations.requests.get", return_value=mock_resp):
            result = get_air_quality(40.7128, -74.006)
            assert result["aqi"] == 35
            assert result["level"] == "Fair"
            assert result["pm10"] == 20.0

    def test_returns_empty_on_error(self):
        with patch("app.services.integrations.requests.get", side_effect=Exception("timeout")):
            result = get_air_quality(40.7128, -74.006)
            assert result == {}

    def test_returns_empty_on_non_200(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 500

        with patch("app.services.integrations.requests.get", return_value=mock_resp):
            result = get_air_quality(40.7128, -74.006)
            assert result == {}
