import json
from uuid import uuid4

from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic shape
    assert isinstance(data, dict)
    # known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    # create a unique test email to avoid collisions with sample data
    email = f"test+{uuid4().hex[:8]}@example.com"
    activity = "Chess Club"

    # Sign up the test email
    signup_resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert signup_resp.status_code == 200
    signup_data = signup_resp.json()
    assert email in signup_data.get("message", "")

    # Verify the participant shows up in activities
    activities_resp = client.get("/activities")
    assert activities_resp.status_code == 200
    activities_data = activities_resp.json()
    participants = activities_data[activity]["participants"]
    assert email in participants

    # Unregister the participant
    del_resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert del_resp.status_code == 200
    del_data = del_resp.json()
    assert "Unregistered" in del_data.get("message", "")

    # Confirm removal from activities
    activities_resp2 = client.get("/activities")
    activities_data2 = activities_resp2.json()
    participants2 = activities_data2[activity]["participants"]
    assert email not in participants2
