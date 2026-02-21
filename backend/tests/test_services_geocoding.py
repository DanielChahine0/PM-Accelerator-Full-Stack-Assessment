"""Tests for the geocoding service — mocked HTTP, cache, coord detection."""
import pytest
from unittest.mock import patch, MagicMock
from app.services.geocoding import (
    geocode_location,
    _looks_like_coords,
    _parse_coords,
    _cache_get,
    _cache_set,
    _geo_cache,
    _cache_lock,
)
from app.schemas.weather import GeocodingResult
import time


# ── _looks_like_coords (pure) ──────────────────────────────────────────────

class TestLooksLikeCoords:
    @pytest.mark.parametrize("query,expected", [
        ("40.7128,-74.006", True),
        ("40.7128, -74.006", True),
        ("-33.8688, 151.2093", True),
        ("0,0", True),
        ("New York", False),
        ("40.7128", False),
        ("40.7128,-74.006,extra", False),
        ("abc,def", False),
        ("", False),
    ])
    def test_detection(self, query, expected):
        assert _looks_like_coords(query) == expected


# ── _parse_coords ───────────────────────────────────────────────────────────

class TestParseCoords:
    def test_standard(self):
        lat, lon = _parse_coords("40.7128,-74.006")
        assert lat == pytest.approx(40.7128)
        assert lon == pytest.approx(-74.006)

    def test_with_spaces(self):
        lat, lon = _parse_coords("40.7128, -74.006")
        assert lat == pytest.approx(40.7128)


# ── Cache ───────────────────────────────────────────────────────────────────

class TestGeoCache:
    def setup_method(self):
        """Clear cache before each test."""
        with _cache_lock:
            _geo_cache.clear()

    def test_set_and_get(self):
        result = GeocodingResult(
            display_name="Test City",
            latitude=1.0,
            longitude=2.0,
        )
        _cache_set("test", result)
        cached = _cache_get("test")
        assert cached is not None
        assert cached.display_name == "Test City"

    def test_miss(self):
        assert _cache_get("nonexistent") is None

    def test_expired_entry(self):
        result = GeocodingResult(display_name="Old", latitude=0, longitude=0)
        with _cache_lock:
            _geo_cache["old"] = (time.time() - 7200, result)  # 2 hours ago > 1h TTL
        assert _cache_get("old") is None


# ── geocode_location ────────────────────────────────────────────────────────

class TestGeocodeLocation:
    def setup_method(self):
        with _cache_lock:
            _geo_cache.clear()

    def test_city_name_geocoding(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {
                "display_name": "New York, NY, USA",
                "lat": "40.7128",
                "lon": "-74.006",
                "address": {
                    "city": "New York",
                    "country": "United States",
                },
            }
        ]

        with patch("app.services.geocoding._rate_limited_get", return_value=mock_resp):
            result = geocode_location("New York")
            assert result.city == "New York"
            assert result.latitude == pytest.approx(40.7128)

    def test_not_found_raises(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = []

        with patch("app.services.geocoding._rate_limited_get", return_value=mock_resp):
            with pytest.raises(ValueError, match="Location not found"):
                geocode_location("xyznonexistent12345")

    def test_coordinates_input_triggers_reverse_geocode(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "display_name": "Near Central Park, NYC",
            "address": {
                "city": "New York",
                "country": "United States",
            },
        }

        with patch("app.services.geocoding._rate_limited_get", return_value=mock_resp):
            result = geocode_location("40.7128,-74.006")
            assert result.latitude == pytest.approx(40.7128)
            assert result.longitude == pytest.approx(-74.006)

    def test_cache_hit_avoids_http(self):
        cached_result = GeocodingResult(
            display_name="Cached City",
            city="Cached",
            country="CachedLand",
            latitude=10.0,
            longitude=20.0,
        )
        _cache_set("london", cached_result)

        # No mock needed — should not call API
        result = geocode_location("London")
        assert result.display_name == "Cached City"

    def test_fallback_to_town_or_county(self):
        """When 'city' is missing, fall back to town/village/county/state."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {
                "display_name": "Small Village, UK",
                "lat": "52.0",
                "lon": "-1.0",
                "address": {
                    "village": "SmallVillage",
                    "country": "United Kingdom",
                },
            }
        ]

        with patch("app.services.geocoding._rate_limited_get", return_value=mock_resp):
            result = geocode_location("Small Village")
            assert result.city == "SmallVillage"
