"""
Dashboard Service
Single-query stats for the main dashboard.
All data for one business is fetched in one DB round-trip per section.
"""
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from uuid import UUID
from decimal import Decimal
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, cast, Date

from app.models.sale import Sale, SaleItem, SaleStatus
from app.models.product import Product
from app.models.customer import Customer
from app.models.invoice import Invoice

logger = logging.getLogger(__name__)


class DashboardService:
    """Compute dashboard metrics with minimal DB queries"""

    def __init__(self, db: Session):
        self.db = db

    def get_all_stats(self, business_id: UUID) -> Dict[str, Any]:
        """
        Return all dashboard metrics in one call.
        Each section is a separate optimized query.

        Args:
            business_id: Tenant UUID

        Returns:
            Complete stats dict consumed by the frontend
        """
        today = date.today()
        month_start = today.replace(day=1)
        week_ago = today - timedelta(days=7)

        return {
            "today": self._today_stats(business_id, today),
            "month": self._month_stats(business_id, month_start, today),
            "totals": self._get_totals(business_id),  # ✅ Agregado para frontend
            "low_stock": self._low_stock(business_id),
            "new_customers": self._new_customers_count(business_id, week_ago),
            "top_products": self._top_products(business_id, month_start, today),
            "recent_sales": self._recent_sales(business_id, limit=10),
            "sales_by_day": self._sales_by_day(business_id, days=7),  # ✅ Renombrado
            "invoice_stats": self._invoice_stats(business_id, today.month, today.year),
            "generated_at": datetime.utcnow().isoformat(),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Today
    # ─────────────────────────────────────────────────────────────────────────

    def _today_stats(self, business_id: UUID, today: date) -> Dict:
        """Count and total of completed sales today"""
        result = (
            self.db.query(
                func.count(Sale.id).label("count"),
                func.coalesce(func.sum(Sale.total), 0).label("revenue"),
            )
            .filter(
                and_(
                    Sale.business_id == business_id,
                    Sale.estado == SaleStatus.COMPLETED,
                    cast(Sale.fecha_venta, Date) == today,
                )
            )
            .first()
        )
        return {
            "sales_count": result.count or 0,
            "revenue": float(result.revenue or 0),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Month
    # ─────────────────────────────────────────────────────────────────────────

    def _month_stats(self, business_id: UUID, month_start: date, today: date) -> Dict:
        """Total revenue for the current month"""
        result = (
            self.db.query(
                func.count(Sale.id).label("count"),
                func.coalesce(func.sum(Sale.total), 0).label("revenue"),
            )
            .filter(
                and_(
                    Sale.business_id == business_id,
                    Sale.estado == SaleStatus.COMPLETED,
                    cast(Sale.fecha_venta, Date) >= month_start,
                    cast(Sale.fecha_venta, Date) <= today,
                )
            )
            .first()
        )
        return {
            "sales_count": result.count or 0,
            "revenue": float(result.revenue or 0),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Totals (✅ NUEVO para el frontend)
    # ─────────────────────────────────────────────────────────────────────────

    def _get_totals(self, business_id: UUID) -> Dict[str, int]:
        """Get total products and customers count"""
        products_count = (
            self.db.query(func.count(Product.id))
            .filter(
                and_(
                    Product.business_id == business_id,
                    Product.is_active == True,
                )
            )
            .scalar()
            or 0
        )

        customers_count = (
            self.db.query(func.count(Customer.id))
            .filter(Customer.business_id == business_id)
            .scalar()
            or 0
        )

        return {
            "products": products_count,
            "customers": customers_count,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Low stock
    # ─────────────────────────────────────────────────────────────────────────

    def _low_stock(self, business_id: UUID) -> Dict:
        """Products where stock_actual <= stock_minimo"""
        products = (
            self.db.query(
                Product.id,
                Product.name,
                Product.sku,
                Product.stock_actual,
                Product.stock_minimo,
            )
            .filter(
                and_(
                    Product.business_id == business_id,
                    Product.is_active == True,
                    Product.control_stock == True,
                    Product.stock_actual <= Product.stock_minimo,
                )
            )
            .order_by(Product.stock_actual.asc())
            .limit(20)
            .all()
        )

        return {
            "count": len(products),
            "products": [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "sku": p.sku,
                    "stock_actual": p.stock_actual,
                    "stock_minimo": p.stock_minimo,
                }
                for p in products
            ],
        }

    # ─────────────────────────────────────────────────────────────────────────
    # New customers
    # ─────────────────────────────────────────────────────────────────────────

    def _new_customers_count(self, business_id: UUID, since: date) -> int:
        """Customers created in the last N days"""
        return (
            self.db.query(func.count(Customer.id))
            .filter(
                and_(
                    Customer.business_id == business_id,
                    cast(Customer.created_at, Date) >= since,
                )
            )
            .scalar()
            or 0
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Top products
    # ─────────────────────────────────────────────────────────────────────────

    def _top_products(
        self, business_id: UUID, start: date, end: date, limit: int = 5
    ) -> List[Dict]:
        """Top N products by quantity sold in the date range"""
        rows = (
            self.db.query(
                Product.id,
                Product.name,
                Product.sku,
                func.sum(SaleItem.cantidad).label("total_qty"),
                func.sum(SaleItem.subtotal).label("total_revenue"),
            )
            .join(SaleItem, SaleItem.product_id == Product.id)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .filter(
                and_(
                    Sale.business_id == business_id,
                    Sale.estado == SaleStatus.COMPLETED,
                    cast(Sale.fecha_venta, Date) >= start,
                    cast(Sale.fecha_venta, Date) <= end,
                )
            )
            .group_by(Product.id, Product.name, Product.sku)
            .order_by(func.sum(SaleItem.cantidad).desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": str(r.id),
                "name": r.name,
                "sku": r.sku,
                "total_qty": int(r.total_qty or 0),
                "total_revenue": float(r.total_revenue or 0),
            }
            for r in rows
        ]

    # ─────────────────────────────────────────────────────────────────────────
    # Recent sales
    # ─────────────────────────────────────────────────────────────────────────

    def _recent_sales(self, business_id: UUID, limit: int = 10) -> List[Dict]:
        """Last N completed sales with customer info"""
        rows = (
            self.db.query(
                Sale.id,
                Sale.numero_venta,
                Sale.fecha_venta,
                Sale.total,
                Sale.metodo_pago,
                Sale.estado,
                Customer.name.label("customer_name"),
            )
            .outerjoin(Customer, Sale.customer_id == Customer.id)
            .filter(Sale.business_id == business_id)
            .order_by(Sale.fecha_venta.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": str(r.id),
                "numero_venta": r.numero_venta,
                "fecha_venta": r.fecha_venta.isoformat() if r.fecha_venta else None,
                "total": float(r.total or 0),
                "metodo_pago": r.metodo_pago.value if r.metodo_pago else "cash",
                "estado": r.estado.value if r.estado else "completed",
                "customer_name": r.customer_name or "Consumidor Final",
            }
            for r in rows
        ]

    # ─────────────────────────────────────────────────────────────────────────
    # Sales by day (chart data) - RENOMBRADO para frontend
    # ─────────────────────────────────────────────────────────────────────────

    def _sales_by_day(self, business_id: UUID, days: int = 7) -> List[Dict]:
        """
        Revenue per day for the last N days.
        Returns all days in range even if revenue is 0 (fills gaps for chart).
        """
        since = date.today() - timedelta(days=days - 1)

        rows = (
            self.db.query(
                cast(Sale.fecha_venta, Date).label("day"),
                func.count(Sale.id).label("count"),
                func.coalesce(func.sum(Sale.total), 0).label("revenue"),
            )
            .filter(
                and_(
                    Sale.business_id == business_id,
                    Sale.estado == SaleStatus.COMPLETED,
                    cast(Sale.fecha_venta, Date) >= since,
                )
            )
            .group_by(cast(Sale.fecha_venta, Date))
            .order_by(cast(Sale.fecha_venta, Date).asc())
            .all()
        )

        # Build a full day-by-day map including zeros
        data_map = {r.day: {"count": r.count, "revenue": float(r.revenue)} for r in rows}
        result = []

        for i in range(days):
            day = since + timedelta(days=i)
            entry = data_map.get(day, {"count": 0, "revenue": 0.0})
            result.append({
                "date": day.isoformat(),
                "label": day.strftime("%d/%m"),
                "count": entry["count"],
                "revenue": entry["revenue"],
            })

        return result

    # ─────────────────────────────────────────────────────────────────────────
    # Invoice stats
    # ─────────────────────────────────────────────────────────────────────────

    def _invoice_stats(self, business_id: UUID, month: int, year: int) -> Dict:
        """Invoice counts by status for the current month"""
        rows = (
            self.db.query(
                Invoice.sri_status,
                func.count(Invoice.id).label("count"),
                func.coalesce(func.sum(Invoice.total), 0).label("amount"),
            )
            .filter(
                and_(
                    Invoice.business_id == business_id,
                    func.extract("month", Invoice.issue_date) == month,
                    func.extract("year", Invoice.issue_date) == year,
                )
            )
            .group_by(Invoice.sri_status)
            .all()
        )

        stats = {"AUTHORIZED": 0, "PENDING": 0, "REJECTED": 0, "total_amount": 0.0}
        for r in rows:
            if r.sri_status in stats:
                stats[r.sri_status] = r.count
            stats["total_amount"] += float(r.amount or 0)

        return stats