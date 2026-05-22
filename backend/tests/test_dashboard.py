"""
Dashboard endpoint tests
"""
import pytest
from fastapi.testclient import TestClient


def test_dashboard_stats_returns_200(client: TestClient, auth_headers):
    """Dashboard endpoint is reachable and returns expected keys"""
    r = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "today"         in data
    assert "month"         in data
    assert "low_stock"     in data
    assert "new_customers" in data
    assert "top_products"  in data
    assert "recent_sales"  in data
    assert "sales_by_day"  in data
    assert "generated_at"  in data


def test_dashboard_today_structure(client: TestClient, auth_headers):
    """Today stats has the expected numeric fields"""
    r    = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    data = r.json()
    today = data["today"]
    assert "sales_count" in today
    assert "revenue"     in today
    assert isinstance(today["sales_count"], int)
    assert isinstance(today["revenue"],     float)


def test_dashboard_month_structure(client: TestClient, auth_headers):
    """Monthly stats has the expected fields"""
    r    = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    data = r.json()
    month = data["month"]
    assert "sales_count" in month
    assert "revenue"     in month


def test_dashboard_low_stock_structure(client: TestClient, auth_headers):
    """Low stock block has count and products list"""
    r    = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    data = r.json()
    ls = data["low_stock"]
    assert "count"    in ls
    assert "products" in ls
    assert isinstance(ls["products"], list)


def test_dashboard_top_products_limit(client: TestClient, auth_headers):
    """Top products returns at most 5 items"""
    r    = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    data = r.json()
    assert len(data["top_products"]) <= 5


def test_dashboard_sales_by_day_7_entries(client: TestClient, auth_headers):
    """Sales-by-day always returns exactly 7 entries"""
    r    = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    data = r.json()
    assert len(data["sales_by_day"]) == 7
    # Each entry has date and revenue
    for entry in data["sales_by_day"]:
        assert "date"    in entry
        assert "revenue" in entry


def test_dashboard_requires_auth(client: TestClient):
    """Unauthenticated requests return 401"""
    r = client.get("/api/v1/dashboard/stats")
    assert r.status_code in (401, 403)


def test_dashboard_recent_sales_structure(client: TestClient, auth_headers, test_sale):
    """Recent sales contains expected fields"""
    r    = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    data = r.json()
    sales = data["recent_sales"]
    assert isinstance(sales, list)
    if sales:
        s = sales[0]
        assert "id"           in s
        assert "total"        in s
        assert "numero_venta" in s