"""Tests for Pydantic schemas — validation logic, edge cases."""
import pytest
from datetime import date, timedelta
from app.schemas.weather import (
    LocationCreate,
    WeatherRecordCreate,
    WeatherRecordUpdate,
    GeocodingResult,
    ForecastDay,
)
from pydantic import ValidationError


# ── LocationCreate ──────────────────────────────────────────────────────────

class TestLocationCreate:
    def test_valid_query(self):
        loc = LocationCreate(query="  New York  ")
        assert loc.query == "New York"  # stripped

    def test_empty_query_raises(self):
        with pytest.raises(ValidationError, match="Location query cannot be empty"):
            LocationCreate(query="   ")

    def test_missing_query_raises(self):
        with pytest.raises(ValidationError):
            LocationCreate()


# ── WeatherRecordCreate ────────────────────────────────────────────────────

class TestWeatherRecordCreate:
    def test_valid_same_day(self):
        rec = WeatherRecordCreate(
            location_query="NYC",
            date_from=date(2025, 1, 1),
            date_to=date(2025, 1, 1),
        )
        assert rec.date_from == rec.date_to

    def test_valid_range(self):
        rec = WeatherRecordCreate(
            location_query="London",
            date_from=date(2025, 1, 1),
            date_to=date(2025, 6, 30),
            notes="Half year",
        )
        assert rec.notes == "Half year"

    def test_date_to_before_date_from_raises(self):
        with pytest.raises(ValidationError, match="date_to must be on or after date_from"):
            WeatherRecordCreate(
                location_query="Paris",
                date_from=date(2025, 6, 1),
                date_to=date(2025, 5, 1),
            )

    def test_range_over_365_days_raises(self):
        with pytest.raises(ValidationError, match="Date range cannot exceed 365 days"):
            WeatherRecordCreate(
                location_query="Tokyo",
                date_from=date(2024, 1, 1),
                date_to=date(2025, 1, 2),  # 367 days
            )

    def test_exactly_365_days_ok(self):
        start = date(2024, 1, 1)
        end = start + timedelta(days=365)
        rec = WeatherRecordCreate(
            location_query="Berlin",
            date_from=start,
            date_to=end,
        )
        assert (rec.date_to - rec.date_from).days == 365


# ── WeatherRecordUpdate ────────────────────────────────────────────────────

class TestWeatherRecordUpdate:
    def test_partial_update_notes_only(self):
        upd = WeatherRecordUpdate(notes="Updated note")
        dump = upd.model_dump(exclude_unset=True)
        assert dump == {"notes": "Updated note"}

    def test_full_update(self):
        upd = WeatherRecordUpdate(
            date_from=date(2025, 3, 1),
            date_to=date(2025, 3, 5),
            temperature_min=5.0,
            temperature_max=15.0,
            humidity=60.0,
        )
        assert upd.temperature_min == 5.0

    def test_invalid_date_range_raises(self):
        with pytest.raises(ValidationError, match="date_to must be on or after date_from"):
            WeatherRecordUpdate(
                date_from=date(2025, 5, 10),
                date_to=date(2025, 5, 1),
            )

    def test_single_date_no_validation_error(self):
        """When only one date is provided, cross-validation doesn't fire."""
        upd = WeatherRecordUpdate(date_from=date(2025, 5, 10))
        assert upd.date_from == date(2025, 5, 10)


# ── GeocodingResult ────────────────────────────────────────────────────────

class TestGeocodingResult:
    def test_full(self):
        geo = GeocodingResult(
            display_name="New York, NY, USA",
            city="New York",
            country="United States",
            latitude=40.7128,
            longitude=-74.006,
        )
        assert geo.latitude == 40.7128

    def test_optional_fields(self):
        geo = GeocodingResult(
            display_name="Unknown Spot",
            latitude=0.0,
            longitude=0.0,
        )
        assert geo.city is None
        assert geo.country is None


# ── ForecastDay ─────────────────────────────────────────────────────────────

class TestForecastDay:
    def test_valid(self):
        fd = ForecastDay(
            date="2025-06-01",
            temp_min=18.0,
            temp_max=25.0,
            description="Clear sky",
            icon="01d",
            humidity=55.0,
            wind_speed=3.5,
            pop=10.0,
        )
        assert fd.description == "Clear sky"
