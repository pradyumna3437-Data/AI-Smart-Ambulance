from fastapi.testclient import TestClient

from app.main import app
from app.routes import ambulances


client = TestClient(app)


def test_recommend_returns_not_found_when_no_ambulance(monkeypatch):
    def no_available_ambulance(db, latitude, longitude):
        return None

    monkeypatch.setattr(ambulances, "recommend_ambulance", no_available_ambulance)
    response = client.get(
        "/api/ambulances/recommend",
        params={"latitude": 12.9716, "longitude": 77.5946},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No available ambulance found"
