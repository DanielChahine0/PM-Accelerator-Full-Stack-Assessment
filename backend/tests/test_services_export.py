"""Tests for the export service — pure functions, no mocking needed."""
import json
import csv
import io
import pytest
from app.services.export import (
    export_json,
    export_csv,
    export_xml,
    export_markdown,
    export_pdf,
    _flatten,
    _escape_xml,
)


# ── Sample data ─────────────────────────────────────────────────────────────

SAMPLE_RECORD = {
    "id": 1,
    "location_id": 10,
    "date_from": "2025-01-01",
    "date_to": "2025-01-05",
    "temperature_min": 2.0,
    "temperature_max": 8.5,
    "temperature_avg": 5.2,
    "humidity": 72.0,
    "wind_speed": 4.1,
    "description": "Overcast clouds",
    "weather_icon": "04d",
    "feels_like": 3.0,
    "pressure": 1013.0,
    "visibility": 10000.0,
    "uv_index": 1.5,
    "forecast_data": [{"date": "2025-01-01", "temp_min": 2}],
    "raw_data": {"big": "blob"},
    "notes": "Winter trip",
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T12:00:00",
    "location": {
        "id": 10,
        "query": "London",
        "display_name": "London, England, UK",
        "city": "London",
        "country": "United Kingdom",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "created_at": "2025-01-01T00:00:00",
    },
}


# ── _flatten ────────────────────────────────────────────────────────────────

class TestFlatten:
    def test_basic_flatten(self):
        flat = _flatten(SAMPLE_RECORD)
        # Location sub-keys should be promoted
        assert "city" in flat or "location.city" in flat
        # raw_data and forecast_data should be skipped
        assert "raw_data" not in flat
        assert "forecast_data" not in flat

    def test_empty_record(self):
        assert _flatten({}) == {}


# ── _escape_xml ─────────────────────────────────────────────────────────────

class TestEscapeXml:
    def test_ampersand(self):
        assert _escape_xml("a&b") == "a&amp;b"

    def test_angle_brackets(self):
        assert _escape_xml("<tag>") == "&lt;tag&gt;"

    def test_quotes(self):
        assert _escape_xml('"hello\'world"') == "&quot;hello&apos;world&quot;"

    def test_no_escaping(self):
        assert _escape_xml("plain text") == "plain text"


# ── export_json ─────────────────────────────────────────────────────────────

class TestExportJson:
    def test_returns_valid_json(self):
        out = export_json([SAMPLE_RECORD])
        parsed = json.loads(out)
        assert isinstance(parsed, list)
        assert len(parsed) == 1
        assert parsed[0]["id"] == 1

    def test_empty_list(self):
        out = export_json([])
        assert json.loads(out) == []


# ── export_csv ──────────────────────────────────────────────────────────────

class TestExportCsv:
    def test_returns_csv_with_header(self):
        out = export_csv([SAMPLE_RECORD])
        reader = csv.reader(io.StringIO(out.decode("utf-8")))
        rows = list(reader)
        assert len(rows) >= 2  # header + 1 data row
        header = rows[0]
        assert "id" in header

    def test_empty_returns_empty_bytes(self):
        assert export_csv([]) == b""


# ── export_xml ──────────────────────────────────────────────────────────────

class TestExportXml:
    def test_well_formed_xml(self):
        out = export_xml([SAMPLE_RECORD])
        text = out.decode("utf-8")
        assert text.startswith('<?xml version="1.0"')
        assert "<weather_records>" in text
        assert "<record>" in text
        assert "</weather_records>" in text

    def test_empty_list(self):
        out = export_xml([])
        text = out.decode("utf-8")
        assert "<weather_records>" in text
        assert "<record>" not in text


# ── export_markdown ─────────────────────────────────────────────────────────

class TestExportMarkdown:
    def test_contains_header_and_table(self):
        out = export_markdown([SAMPLE_RECORD])
        text = out.decode("utf-8")
        assert "# Weather Records Export" in text
        assert "| Field | Value |" in text
        assert "Record #1" in text

    def test_empty_list(self):
        out = export_markdown([])
        text = out.decode("utf-8")
        assert "# Weather Records Export" in text
        assert "| Field | Value |" not in text


# ── export_pdf ──────────────────────────────────────────────────────────────

class TestExportPdf:
    def test_returns_pdf_bytes(self):
        out = export_pdf([SAMPLE_RECORD])
        assert isinstance(out, bytes)
        assert len(out) > 100
        # PDF magic bytes
        assert out[:5] == b"%PDF-"

    def test_empty_list_produces_pdf(self):
        out = export_pdf([])
        assert out[:5] == b"%PDF-"
