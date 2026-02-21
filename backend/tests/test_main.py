"""Tests for root endpoints: /, /health."""
from fastapi.testclient import TestClient
from app.main import app as fastapi_app


class TestRootEndpoints:
    """These are stateless — no DB needed, so we use a plain TestClient."""

    def setup_method(self):
        self.client = TestClient(fastapi_app)

    def test_root_returns_info(self):
        resp = self.client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "Weather App API"
        assert body["author"] == "Daniel Chahine"
        assert body["version"] == "1.0.0"
        assert "docs" in body

    def test_health(self):
        resp = self.client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}
