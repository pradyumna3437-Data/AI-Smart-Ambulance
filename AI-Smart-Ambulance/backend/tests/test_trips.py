from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_trips_returns_a_list():
    response = client.get("/api/trips/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
