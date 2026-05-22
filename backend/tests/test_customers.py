"""
Customers endpoints tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_create_customer(client: TestClient, auth_headers):
    """Test create customer"""
    response = client.post(
        "/api/v1/customers/",
        headers=auth_headers,
        json={
            "phone_number": "+593999999991",
            "name": "New Customer",
            "identification": "1234567890",
            "email": "new@customer.com",
            "address": "Test Address"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["phone_number"] == "+593999999991"
    assert data["name"] == "New Customer"
    assert "id" in data


def test_list_customers(client: TestClient, auth_headers, test_customer):
    """Test list customers"""
    response = client.get(
        "/api/v1/customers/",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


def test_get_customer(client: TestClient, auth_headers, test_customer):
    """Test get customer by ID"""
    response = client.get(
        f"/api/v1/customers/{test_customer.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_customer.id)
    assert data["phone_number"] == test_customer.phone_number


def test_update_customer(client: TestClient, auth_headers, test_customer):
    """Test update customer"""
    response = client.put(
        f"/api/v1/customers/{test_customer.id}",
        headers=auth_headers,
        json={
            "name": "Updated Name",
            "address": "New Address"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["address"] == "New Address"


def test_get_by_phone(client: TestClient, auth_headers, test_customer):
    """Test get customer by phone"""
    response = client.get(
        f"/api/v1/customers/phone/{test_customer.phone_number}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["phone_number"] == test_customer.phone_number


def test_search_customers(client: TestClient, auth_headers, test_customer):
    """Test search customers"""
    response = client.get(
        "/api/v1/customers/?search=Test",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1