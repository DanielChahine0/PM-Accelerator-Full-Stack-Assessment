# Test Plan

## Overview

Automated test suites for both the **backend** (Python/FastAPI) and **frontend** (React/Vite).

## How to Run

### Backend (pytest)

```bash
cd backend
source venv/bin/activate   # or your virtualenv activation
pip install pytest pytest-mock httpx
pytest tests/ -v
```

### Frontend (vitest)

```bash
cd frontend
npm install
npm test
```

---

## Backend Tests (125 tests)

| File | Layer | What's Tested |
|------|-------|---------------|
| `tests/test_schemas.py` | Unit | Pydantic schema validation — LocationCreate, WeatherRecordCreate/Update, GeocodingResult, ForecastDay. Edge cases: empty queries, invalid date ranges, >365 days, partial updates. |
| `tests/test_services_export.py` | Unit | Export service pure functions — JSON, CSV, XML, Markdown, PDF output. Also tests `_flatten` and `_escape_xml` helpers. |
| `tests/test_services_integrations.py` | Unit | Integrations service — `_aqi_level` categorization, `get_openstreetmap_embed_url` (no HTTP), `get_youtube_videos` and `get_air_quality` with mocked HTTP. |
| `tests/test_services_geocoding.py` | Unit | Geocoding service — coord detection (`_looks_like_coords`), coord parsing, TTL cache behavior, `geocode_location` with forward/reverse geocoding, cache hits, fallback fields. |
| `tests/test_services_weather_api.py` | Unit | Weather API service — `_check_api_key`, `_handle_owm_error`, `get_current_weather`, `get_forecast` (daily aggregation), `get_historical_weather`, `build_weather_snapshot` (future vs past logic). |
| `tests/test_main.py` | Integration | Root endpoints — `GET /` info, `GET /health`. |
| `tests/test_routers_weather.py` | Integration | Weather CRUD routes via TestClient — create, list (pagination, filtering), get, update (partial, invalid dates), delete. Also live weather/forecast/geocode endpoints. Uses SQLite in-memory DB. |
| `tests/test_routers_export.py` | Integration | Export routes — all 5 formats, unsupported format error, empty DB, filter by record IDs, invalid IDs, Content-Disposition headers. |
| `tests/test_routers_integrations.py` | Integration | Integrations routes — YouTube, map, air-quality endpoints with mocked services. |

### Key design decisions

- **SQLite in-memory** with `StaticPool` for fast, isolated DB tests (no PostgreSQL needed)
- **All external HTTP is blocked** by default (`autouse` fixture) — individual tests mock `requests.get` explicitly
- Models are imported in conftest so `Base.metadata.create_all` picks them up

---

## Frontend Tests (20 tests)

| File | What's Tested |
|------|---------------|
| `src/services/api.test.js` | API service layer — correct endpoint, HTTP method, and parameter passing for createRecord, listRecords, getRecord, updateRecord, deleteRecord, exportRecords (with/without IDs). Axios is fully mocked. |
| `src/components/SearchBar.test.jsx` | SearchBar component — renders input/buttons, disabled when loading, trims input on submit, calls `onSearch`, custom placeholder, clears error on typing. |
| `src/components/ExportButtons.test.jsx` | ExportButtons component — renders all 5 format buttons, calls `exportRecords` with correct format, error toast on failure, passes `recordIds` prop. |
| `src/App.test.jsx` | App routing — renders Navbar, renders Home page on `/`. |

### Key design decisions

- **Vitest** (idiomatic for Vite projects) with `jsdom` environment
- **@testing-library/react** for component tests (behavior-focused)
- Heavy page components mocked in App test to keep it fast
- Axios fully mocked — no real network calls

---

## Frameworks Added

| Tool | Why |
|------|-----|
| `pytest` + `pytest-mock` | Standard Python test framework; already implied by FastAPI ecosystem |
| `httpx` | Required by FastAPI `TestClient` |
| `vitest` | Native Vite test runner — zero config, fast |
| `@testing-library/react` + `jest-dom` + `user-event` | Standard React testing approach — behavior over implementation |
| `jsdom` | DOM environment for Vitest |

---

## Known Gaps / Next Steps

1. **E2E tests** — No Playwright/Cypress tests yet. Would cover full user flows (search → view weather → save → export).
2. **Frontend page tests** — Home and History pages have complex state; could benefit from integration tests with mocked API.
3. **Database migration tests** — Alembic migration up/down not tested.
4. **CI pipeline** — No GitHub Actions workflow yet. Tests run locally.
5. **Coverage reporting** — Add `--cov` (pytest) / `--coverage` (vitest) for visibility.
