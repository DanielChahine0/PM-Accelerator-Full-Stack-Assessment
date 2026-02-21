"""
Shared fixtures for backend tests.

Uses an in-memory SQLite database so tests run without PostgreSQL.
All external HTTP calls are blocked by default via the `block_requests` fixture.
"""
import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app as fastapi_app

# Import models so they register on Base.metadata before create_all
import app.models.weather  # noqa: F401


# ── SQLite in-memory engine ─────────────────────────────────────────────────
# StaticPool ensures all connections share a single in-memory database.
TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Enable foreign keys in SQLite
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _rec):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Database fixture ────────────────────────────────────────────────────────

@pytest.fixture()
def db():
    """Create all tables, yield a session, then drop everything."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# ── FastAPI TestClient ──────────────────────────────────────────────────────

@pytest.fixture()
def client(db):
    """
    TestClient that uses the test SQLite session instead of the real DB.
    """

    def _override_get_db():
        try:
            yield db
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.clear()


# ── Block real HTTP requests ────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def block_requests(monkeypatch):
    """
    Prevent any real HTTP call from leaking during tests.
    Individual tests should mock `requests.get` explicitly.
    """

    def _blocked(*args, **kwargs):
        raise RuntimeError(f"Unmocked HTTP request: {args!r}")

    monkeypatch.setattr("requests.get", _blocked)
    monkeypatch.setattr("requests.post", _blocked)


# ── Convenience helpers ─────────────────────────────────────────────────────

@pytest.fixture()
def geocoding_result():
    """A reusable GeocodingResult dict (matches the Pydantic schema)."""
    from app.schemas.weather import GeocodingResult

    return GeocodingResult(
        display_name="New York, NY, USA",
        city="New York",
        country="United States",
        latitude=40.7128,
        longitude=-74.006,
    )
