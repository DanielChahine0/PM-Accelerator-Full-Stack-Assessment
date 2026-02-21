"""Integration tests for /export routes."""
import pytest
import json
from unittest.mock import patch
from datetime import date
from app.schemas.weather import GeocodingResult


MOCK_GEO = GeocodingResult(
    display_name="London, UK",
    city="London",
    country="United Kingdom",
    latitude=51.5074,
    longitude=-0.1278,
)


def _seed_record(client):
    """Create a record so there's data to export."""
    with patch("app.routers.weather.geocode_location", return_value=MOCK_GEO), \
         patch("app.routers.weather.build_weather_snapshot", return_value={
             "temperature_min": 5.0,
             "temperature_max": 12.0,
             "temperature_avg": 8.0,
             "humidity": 80,
             "wind_speed": 6.0,
             "description": "Rain",
             "weather_icon": "09d",
         }), \
         patch("app.routers.weather.get_weather_for_date_range", return_value={"forecast": []}):
        return client.post("/weather/records", json={
            "location_query": "London",
            "date_from": str(date.today()),
            "date_to": str(date.today()),
        })


class TestExportRecords:
    def test_export_json(self, client):
        _seed_record(client)
        resp = client.get("/export/records", params={"format": "json"})
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("application/json")
        data = json.loads(resp.content)
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_export_csv(self, client):
        _seed_record(client)
        resp = client.get("/export/records", params={"format": "csv"})
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/csv")
        text = resp.content.decode("utf-8")
        assert "id" in text  # header row

    def test_export_xml(self, client):
        _seed_record(client)
        resp = client.get("/export/records", params={"format": "xml"})
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("application/xml")
        text = resp.content.decode("utf-8")
        assert "<weather_records>" in text

    def test_export_markdown(self, client):
        _seed_record(client)
        resp = client.get("/export/records", params={"format": "markdown"})
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/markdown")
        text = resp.content.decode("utf-8")
        assert "# Weather Records Export" in text

    def test_export_pdf(self, client):
        _seed_record(client)
        resp = client.get("/export/records", params={"format": "pdf"})
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("application/pdf")
        assert resp.content[:5] == b"%PDF-"

    def test_export_unsupported_format(self, client):
        resp = client.get("/export/records", params={"format": "yaml"})
        assert resp.status_code == 400
        assert "Unsupported format" in resp.json()["detail"]

    def test_export_empty_db(self, client):
        resp = client.get("/export/records", params={"format": "json"})
        assert resp.status_code == 200
        assert json.loads(resp.content) == []

    def test_export_by_record_ids(self, client):
        create_resp = _seed_record(client)
        record_id = create_resp.json()["id"]
        resp = client.get("/export/records", params={"format": "json", "record_ids": str(record_id)})
        assert resp.status_code == 200
        data = json.loads(resp.content)
        assert len(data) == 1
        assert data[0]["id"] == record_id

    def test_export_invalid_record_ids(self, client):
        resp = client.get("/export/records", params={"format": "json", "record_ids": "abc"})
        assert resp.status_code == 400
        assert "comma-separated integers" in resp.json()["detail"]

    def test_content_disposition_header(self, client):
        _seed_record(client)
        resp = client.get("/export/records", params={"format": "csv"})
        assert "content-disposition" in resp.headers
        assert "weather_records.csv" in resp.headers["content-disposition"]
