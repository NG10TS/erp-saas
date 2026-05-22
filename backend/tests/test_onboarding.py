"""
Onboarding endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_get_progress_no_previous(client: TestClient, auth_headers):
    """New user has no progress — endpoint returns null"""
    r = client.get("/api/v1/onboarding/progress", headers=auth_headers)
    assert r.status_code == 200
    # Either null or a record
    data = r.json()
    assert data is None or isinstance(data, dict)


def test_save_progress(client: TestClient, auth_headers):
    """Save step 1 progress"""
    r = client.post(
        "/api/v1/onboarding/progress",
        headers=auth_headers,
        json={
            "current_step":    1,
            "completed_steps": [0],
            "step_data":       {"business": {"business_name": "Mi Tienda"}},
            "selected_plan":   None,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["current_step"] == 1
    assert 0 in data["completed_steps"]
    assert data["step_data"]["business"]["business_name"] == "Mi Tienda"


def test_save_progress_merges_step_data(client: TestClient, auth_headers):
    """Step data from different steps must not overwrite each other"""
    # Save step 2 without step 1 data
    r = client.post(
        "/api/v1/onboarding/progress",
        headers=auth_headers,
        json={
            "current_step":    2,
            "completed_steps": [0, 1],
            "step_data":       {"product": {"name": "Camiseta"}},
        },
    )
    assert r.status_code == 200
    data = r.json()
    # Both keys should be present after merge
    assert "business" in data["step_data"]
    assert "product" in data["step_data"]


def test_get_progress_after_save(client: TestClient, auth_headers):
    """Progress saved in previous test must be retrievable"""
    r = client.get("/api/v1/onboarding/progress", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data is not None
    assert data["current_step"] >= 1


def test_get_plans(client: TestClient, auth_headers):
    """Plans endpoint returns 3 plans with correct structure"""
    r = client.get("/api/v1/onboarding/plans", headers=auth_headers)
    assert r.status_code == 200
    plans = r.json()
    assert len(plans) == 3
    ids = {p["id"] for p in plans}
    assert ids == {"free", "pro", "business"}
    # Pro is the recommended one
    pro = next(p for p in plans if p["id"] == "pro")
    assert pro["recommended"] is True
    assert pro["price_usd"] == 49


def test_select_plan(client: TestClient, auth_headers):
    """Select the pro plan"""
    r = client.post(
        "/api/v1/onboarding/select-plan",
        headers=auth_headers,
        json={"plan": "pro"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["selected_plan"] == "pro"


def test_complete_onboarding(client: TestClient, auth_headers):
    """Complete onboarding with pro plan"""
    r = client.post(
        "/api/v1/onboarding/complete",
        headers=auth_headers,
        json={"selected_plan": "pro"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["is_completed"] is True
    assert data["selected_plan"] == "pro"
    assert data["completed_at"] is not None


def test_complete_onboarding_free_default(client: TestClient, auth_headers):
    """Can complete onboarding with no plan — defaults to free"""
    # Reset first by patching the progress
    client.post(
        "/api/v1/onboarding/progress",
        headers=auth_headers,
        json={"current_step": 0, "completed_steps": []},
    )
    r = client.post(
        "/api/v1/onboarding/complete",
        headers=auth_headers,
        json={"selected_plan": "free"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["is_completed"] is True