"""
Authentication tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import security_service


def test_register(client: TestClient, db: Session):
    """Test user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new@user.com",
            "username": "newuser",
            "password": "TestPass123",
            "first_name": "New",
            "last_name": "User",
            "phone": "0999999997",
            "ruc": "1234567890002",
            "business_name": "New Business",
            "commercial_name": "New Shop"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@user.com"
    assert data["username"] == "newuser"
    assert "id" in data


def test_login(client: TestClient, test_user):
    """Test login"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "testuser",
            "password": "testpass123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert "business" in data


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "wronguser",
            "password": "wrongpass"
        }
    )
    
    assert response.status_code == 401


def test_refresh_token(client: TestClient, test_user):
    """Test token refresh"""
    # First login
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "testuser",
            "password": "testpass123"
        }
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Refresh token
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_change_password(client: TestClient, test_user, auth_headers):
    """Test password change"""
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "testpass123",
            "new_password": "NewPass123",
            "confirm_password": "NewPass123"
        }
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"


def test_change_password_wrong_current(client: TestClient, test_user, auth_headers):
    """Test password change with wrong current password"""
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "wrongpass",
            "new_password": "NewPass123",
            "confirm_password": "NewPass123"
        }
    )
    
    assert response.status_code == 400
    assert "Current password is incorrect" in response.json()["message"]