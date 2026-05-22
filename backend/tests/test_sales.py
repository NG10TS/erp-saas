"""
Sales endpoints tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_create_sale(
    client: TestClient,
    auth_headers,
    test_business,
    test_products,
    test_customer
):
    """Test create sale"""
    response = client.post(
        "/api/v1/sales/",
        headers=auth_headers,
        json={
            "customer_id": str(test_customer.id),
            "payment_method": "cash",
            "notes": "Test sale",
            "items": [
                {
                    "product_id": str(test_products[0].id),
                    "quantity": 2
                },
                {
                    "product_id": str(test_products[1].id),
                    "quantity": 1
                }
            ]
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "sale_number" in data
    assert data["total"] > 0
    assert len(data["items"]) == 2


def test_list_sales(client: TestClient, auth_headers):
    """Test list sales"""
    response = client.get(
        "/api/v1/sales/",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_sale(client: TestClient, auth_headers, test_products, test_customer):
    """Test get sale by ID"""
    # First create a sale
    create_response = client.post(
        "/api/v1/sales/",
        headers=auth_headers,
        json={
            "customer_id": str(test_customer.id),
            "payment_method": "cash",
            "items": [
                {
                    "product_id": str(test_products[0].id),
                    "quantity": 1
                }
            ]
        }
    )
    sale_id = create_response.json()["id"]
    
    # Get the sale
    response = client.get(
        f"/api/v1/sales/{sale_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sale_id


def test_confirm_sale(client: TestClient, auth_headers, test_products, test_customer):
    """Test confirm sale"""
    # Create sale
    create_response = client.post(
        "/api/v1/sales/",
        headers=auth_headers,
        json={
            "customer_id": str(test_customer.id),
            "payment_method": "cash",
            "items": [
                {
                    "product_id": str(test_products[0].id),
                    "quantity": 1
                }
            ]
        }
    )
    sale_id = create_response.json()["id"]
    
    # Confirm sale
    response = client.post(
        f"/api/v1/sales/{sale_id}/confirm",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert "Sale confirmed" in response.json()["message"]


def test_today_stats(client: TestClient, auth_headers):
    """Test today's sales stats"""
    response = client.get(
        "/api/v1/sales/stats/today",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "total_sales" in data
    assert "total_amount" in data


def test_monthly_stats(client: TestClient, auth_headers):
    """Test monthly sales stats"""
    from datetime import datetime
    now = datetime.now()
    
    response = client.get(
        f"/api/v1/sales/stats/monthly?year={now.year}&month={now.month}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["year"] == now.year
    assert data["month"] == now.month