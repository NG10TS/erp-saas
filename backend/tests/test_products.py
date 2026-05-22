"""
Products endpoints tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_list_products(client: TestClient, auth_headers, test_products):
    """Test list products"""
    response = client.get(
        "/api/v1/products/",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert data[0]["name"] == "Test Product 0"


def test_create_product(client: TestClient, auth_headers):
    """Test create product"""
    response = client.post(
        "/api/v1/products/",
        headers=auth_headers,
        json={
            "name": "New Product",
            "sku": "NEW001",
            "price": 29.99,
            "stock_quantity": 50,
            "category": "Electronics",
            "iva_percentage": 15.0,
            "description": "Test description"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Product"
    assert data["sku"] == "NEW001"
    assert "id" in data


def test_get_product(client: TestClient, auth_headers, test_products):
    """Test get product by ID"""
    product_id = test_products[0].id
    
    response = client.get(
        f"/api/v1/products/{product_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(product_id)
    assert data["name"] == "Test Product 0"


def test_update_product(client: TestClient, auth_headers, test_products):
    """Test update product"""
    product_id = test_products[0].id
    
    response = client.put(
        f"/api/v1/products/{product_id}",
        headers=auth_headers,
        json={
            "name": "Updated Product",
            "price": 15.99
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Product"
    assert float(data["price"]) == 15.99


def test_update_stock(client: TestClient, auth_headers, test_products):
    """Test update stock"""
    product_id = test_products[0].id
    
    response = client.post(
        f"/api/v1/products/{product_id}/stock",
        headers=auth_headers,
        json={
            "quantity": 75,
            "reason": "Inventory count"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["new_stock"] == 75


def test_search_products(client: TestClient, auth_headers, test_products):
    """Test search products"""
    response = client.get(
        "/api/v1/products/?search=Test Product",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


def test_low_stock_products(client: TestClient, auth_headers, test_products, db):
    """Test low stock products endpoint"""
    # Set one product low stock
    from app.models.product import Product
    product = db.query(Product).first()
    product.stock_quantity = 5
    product.min_stock = 10
    db.commit()
    
    response = client.get(
        "/api/v1/products/?low_stock=true",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


def test_delete_product(client: TestClient, auth_headers, test_products):
    """Test delete product"""
    product_id = test_products[0].id
    
    response = client.delete(
        f"/api/v1/products/{product_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Product deleted successfully"