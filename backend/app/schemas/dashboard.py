# app/schemas/dashboard.py
"""
Dashboard schemas for the single‑endpoint response.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal


class TodayStats(BaseModel):
    sales_count: int
    revenue: float


class MonthStats(BaseModel):
    sales_count: int
    revenue: float


class LowStockProduct(BaseModel):
    id: str
    name: str
    sku: Optional[str] = None
    stock_actual: int
    stock_minimo: int


class LowStockStats(BaseModel):
    count: int
    products: List[LowStockProduct]


class NewCustomersStats(BaseModel):
    count: int


class TopProduct(BaseModel):
    id: str
    name: str
    sku: Optional[str] = None
    total_qty: int
    total_revenue: float


class RecentSale(BaseModel):
    id: str
    numero_venta: str
    fecha_venta: Optional[str] = None
    total: float
    metodo_pago: str
    estado: str
    customer_name: str


class SalesByDay(BaseModel):
    date: str
    label: str
    count: int
    revenue: float


class InvoiceStats(BaseModel):
    AUTHORIZED: int
    PENDING: int
    REJECTED: int
    total_amount: float


class DashboardStatsResponse(BaseModel):
    today: TodayStats
    month: MonthStats
    low_stock: LowStockStats
    new_customers: int
    top_products: List[TopProduct]
    recent_sales: List[RecentSale]
    sales_by_day: List[SalesByDay]
    invoice_stats: InvoiceStats
    generated_at: str