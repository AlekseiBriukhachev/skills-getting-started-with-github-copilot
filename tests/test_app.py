from fastapi.testclient import TestClient
import src.app as app_module

client = TestClient(app_module.app)


def test_get_activities_structure():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # basic keys
    assert "Chess Club" in data
    activity = data["Chess Club"]
    assert "description" in activity
    assert "participants" in activity


def test_signup_and_unregister_flow():
    email = "test.py@mergington.edu"
    activity_name = "Chess Club"

    # ensure not present
    res = client.get("/activities")
    participants = res.json()[activity_name]["participants"]
    if email in participants:
        # cleanup before test
        app_module.activities[activity_name]["participants"].remove(email)

    # signup
    res = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert res.status_code == 200
    assert "Signed up" in res.json()["message"]

    # verify present
    res = client.get("/activities")
    participants = res.json()[activity_name]["participants"]
    assert email in participants

    # unregister
    res = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert res.status_code == 200
    assert "Unregistered" in res.json()["message"]

    # verify removed
    res = client.get("/activities")
    participants = res.json()[activity_name]["participants"]
    assert email not in participants
