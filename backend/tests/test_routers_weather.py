"""Integration tests for weather CRUD routes — uses TestClient + SQLite."""
import pytest
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from app.schemas.weather import GeocodingResult


# ── Shared mock helpers ─────────────────────────────────────────────────────

MOCK_GEO = GeocodingResult(
    display_name="New York, NY, USA",
    city="New York",
    country="United States",
    latitude=40.7128,
    longitude=-74.006,
)

MOCK_OWM_RESPONSE = {
    "main": {
        "temp": 15.5,
        "feels_like": 14.0,
        "temp_min": 13.0,
        "temp_max": 17.0,
        "humidity": 72,
        "pressure": 1013,
    },
    "wind": {"speed": 4.2},
    "visibility": 10000,
    "weather": [{"description": "overcast clouds", "icon": "04d"}],
    "dt": 1700000000,
}


def _mock_requests_get(*args, **kwargs):
    """Generic mock for requests.get that returns OWM-like data."""
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = MOCK_OWM_RESPONSE
    return resp


# ── Live weather endpoints ──────────────────────────────────────────────────

class TestCurrentWeather:
    def test_success(self, client):
        with patch("app.routers.weather.geocode_location", return_value=MOCK_GEO), \
             patch("app.routers.weather.get_current_weather") as mock_cw:
            from app.schemas.weather import CurrentWeatherResponse
            mock_cw.return_value = CurrentWeatherResponse(
                location=MOCK_GEO,
                temperature=15.5,
                feels_like=14.0,
                temp_min=13.0,
                temp_max=17.0,
                humidity=72,
                pressure=1013,
                wind_speed=4.2,
                visibility=10000,
                description="Overcast clouds",
                icon="04d",
                dt=1700000000,
            )
            resp = client.get("/weather/current", params={"location": "New York"})
            assert resp.status_code == 200
            body = resp.json()
            assert body["temperature"] == 15.5
            assert body["location"]["city"] == "New York"

    def test_missing_location_param(self, client):
        resp = client.get("/weather/current")
        assert resp.status_code == 422  # FastAPI validation error

    def test_geocode_failure_returns_400(self, client):
        with patch("app.routers.weather.geocode_location", side_effect=ValueError("Not found")):
            resp = client.get("/weather/current", params={"location": "xyzabc"})
            assert resp.status_code == 400


class TestForecast:
    def test_success(self, client):
        from app.schemas.weather import ForecastResponse, ForecastDay
        with patch("app.routers.weather.geocode_location", return_value=MOCK_GEO), \
             patch("app.routers.weather.get_forecast") as mock_fc:
            mock_fc.return_value = ForecastResponse(
                location=MOCK_GEO,
                forecast=[
                    ForecastDay(
                        date="2025-06-01",
                        temp_min=18.0,
                        temp_max=25.0,
                        description="Clear",
                        icon="01d",
                        humidity=55,
                        wind_speed=3.5,
                        pop=10,
                    )
                ],
            )
            resp = client.get("/weather/forecast", params={"location": "London"})
            assert resp.status_code == 200
            body = resp.json()
            assert len(body["forecast"]) == 1


class TestGeocode:
    def test_success(self, client):
        with patch("app.routers.weather.geocode_location", return_value=MOCK_GEO):
            resp = client.get("/weather/geocode", params={"location": "NYC"})
            assert resp.status_code == 200
            assert resp.json()["latitude"] == pytest.approx(40.7128)

    def test_not_found(self, client):
        with patch("app.routers.weather.geocode_location", side_effect=ValueError("Not found")):
            resp = client.get("/weather/geocode", params={"location": "xyz"})
            assert resp.status_code == 404


# ── CRUD endpoints ──────────────────────────────────────────────────────────

def _create_record(client, location_query="New York", date_from=None, date_to=None, notes=None):
    """Helper to create a weather record via the API."""
    if date_from is None:
        date_from = str(date.today())
    if date_to is None:
        date_to = str(date.today())

    payload = {
        "location_query": location_query,
        "date_from": date_from,
        "date_to": date_to,
    }
    if notes:
        payload["notes"] = notes

    with patch("app.routers.weather.geocode_location", return_value=MOCK_GEO), \
         patch("app.routers.weather.build_weather_snapshot", return_value={
             "temperature_min": 13.0,
             "temperature_max": 17.0,
             "temperature_avg": 15.5,
             "humidity": 72,
             "wind_speed": 4.2,
             "description": "Overcast clouds",
             "weather_icon": "04d",
             "feels_like": 14.0,
             "pressure": 1013,
             "visibility": 10000,
         }), \
         patch("app.routers.weather.get_weather_for_date_range", return_value={"forecast": []}):
        return client.post("/weather/records", json=payload)


class TestCreateRecord:
    def test_create_success(self, client):
        resp = _create_record(client, notes="Test note")
        assert resp.status_code == 201
        body = resp.json()
        assert body["location"]["city"] == "New York"
        assert body["temperature_avg"] == 15.5
        assert body["notes"] == "Test note"
        assert "id" in body

    def test_create_reuses_existing_location(self, client):
        """Creating two records for the same coords should reuse the location."""
        resp1 = _create_record(client)
        resp2 = _create_record(client)
        assert resp1.status_code == 201
        assert resp2.status_code == 201
        assert resp1.json()["location"]["id"] == resp2.json()["location"]["id"]

    def test_create_invalid_date_range(self, client):
        resp = _create_record(client, date_from="2025-06-10", date_to="2025-06-01")
        assert resp.status_code == 422  # Pydantic validation error

    def test_create_geocode_failure(self, client):
        with patch("app.routers.weather.geocode_location", side_effect=ValueError("Not found")):
            resp = client.post("/weather/records", json={
                "location_query": "xyzabc",
                "date_from": str(date.today()),
                "date_to": str(date.today()),
            })
            assert resp.status_code == 400


class TestListRecords:
    def test_list_empty(self, client):
        resp = client.get("/weather/records")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_records(self, client):
        _create_record(client)
        _create_record(client, date_from="2025-01-01", date_to="2025-01-02")
        resp = client.get("/weather/records")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_pagination(self, client):
        for _ in range(3):
            _create_record(client)
        resp = client.get("/weather/records", params={"skip": 0, "limit": 2})
        assert len(resp.json()) == 2

    def test_filter_by_location_id(self, client):
        resp = _create_record(client)
        loc_id = resp.json()["location"]["id"]
        resp = client.get("/weather/records", params={"location_id": loc_id})
        assert resp.status_code == 200
        assert all(r["location"]["id"] == loc_id for r in resp.json())


class TestGetRecord:
    def test_get_existing(self, client):
        create_resp = _create_record(client)
        record_id = create_resp.json()["id"]
        resp = client.get(f"/weather/records/{record_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == record_id

    def test_get_nonexistent(self, client):
        resp = client.get("/weather/records/9999")
        assert resp.status_code == 404


class TestUpdateRecord:
    def test_update_notes(self, client):
        create_resp = _create_record(client)
        record_id = create_resp.json()["id"]
        resp = client.patch(f"/weather/records/{record_id}", json={"notes": "Updated!"})
        assert resp.status_code == 200
        assert resp.json()["notes"] == "Updated!"

    def test_update_temperature(self, client):
        create_resp = _create_record(client)
        record_id = create_resp.json()["id"]
        resp = client.patch(f"/weather/records/{record_id}", json={"temperature_max": 99.9})
        assert resp.status_code == 200
        assert resp.json()["temperature_max"] == 99.9

    def test_update_nonexistent(self, client):
        resp = client.patch("/weather/records/9999", json={"notes": "x"})
        assert resp.status_code == 404

    def test_update_invalid_dates(self, client):
        create_resp = _create_record(client, date_from="2025-01-01", date_to="2025-01-10")
        record_id = create_resp.json()["id"]
        resp = client.patch(f"/weather/records/{record_id}", json={
            "date_from": "2025-01-15",
            "date_to": "2025-01-10",
        })
        assert resp.status_code in (400, 422)  # Pydantic or router validation


class TestDeleteRecord:
    def test_delete_existing(self, client):
        create_resp = _create_record(client)
        record_id = create_resp.json()["id"]
        resp = client.delete(f"/weather/records/{record_id}")
        assert resp.status_code == 204
        # Confirm deleted
        get_resp = client.get(f"/weather/records/{record_id}")
        assert get_resp.status_code == 404

    def test_delete_nonexistent(self, client):
        resp = client.delete("/weather/records/9999")
        assert resp.status_code == 404
